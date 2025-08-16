-- 创建转写任务表
CREATE TABLE IF NOT EXISTS public.transcription_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- 任务基本信息
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  dashscope_task_id TEXT UNIQUE,
  
  -- 文件信息
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  
  -- 转写配置
  speaker_count INTEGER,
  language_hints TEXT[] DEFAULT ARRAY['zh', 'en'],
  
  -- 结果信息
  duration INTEGER, -- 音频时长 (毫秒)
  segments_count INTEGER DEFAULT 0,
  speaker_count_detected INTEGER,
  
  -- 完成时间
  completed_at TIMESTAMPTZ,
  
  -- 错误信息
  error TEXT,
  
  -- 转写结果 (JSON)
  result JSONB,
  
  -- AI总结结果 (JSON)
  ai_summary JSONB,
  ai_summary_generated_at TIMESTAMPTZ,
  
  -- 用户信息 (如果需要用户系统)
  user_id UUID,
  
  -- 索引
  CONSTRAINT valid_duration CHECK (duration IS NULL OR duration >= 0),
  CONSTRAINT valid_segments_count CHECK (segments_count >= 0),
  CONSTRAINT valid_speaker_count CHECK (speaker_count IS NULL OR (speaker_count >= 1 AND speaker_count <= 10))
);

-- 创建转写片段表 (用于存储详细的转写片段)
CREATE TABLE IF NOT EXISTS public.transcription_segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.transcription_tasks(id) ON DELETE CASCADE,
  
  -- 片段信息
  segment_index INTEGER NOT NULL,
  start_time INTEGER NOT NULL, -- 开始时间 (毫秒)
  end_time INTEGER NOT NULL, -- 结束时间 (毫秒)
  
  -- 转写内容
  text TEXT NOT NULL,
  speaker_id TEXT,
  confidence DECIMAL(5,4), -- 置信度 (0-1)
  
  -- 词级别数据 (JSON)
  words JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- 约束
  CONSTRAINT valid_time_range CHECK (start_time >= 0 AND end_time > start_time),
  CONSTRAINT valid_confidence CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  CONSTRAINT unique_task_segment UNIQUE(task_id, segment_index)
);

-- 创建任务统计表
CREATE TABLE IF NOT EXISTS public.transcription_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  
  -- 任务统计
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  failed_tasks INTEGER DEFAULT 0,
  pending_tasks INTEGER DEFAULT 0,
  
  -- 处理统计
  total_duration INTEGER DEFAULT 0, -- 总音频时长 (毫秒)
  total_segments INTEGER DEFAULT 0,
  
  -- 文件统计
  total_file_size BIGINT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT unique_date UNIQUE(date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_transcription_tasks_status ON public.transcription_tasks(status);
CREATE INDEX IF NOT EXISTS idx_transcription_tasks_created_at ON public.transcription_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transcription_tasks_dashscope_id ON public.transcription_tasks(dashscope_task_id);
CREATE INDEX IF NOT EXISTS idx_transcription_tasks_user_id ON public.transcription_tasks(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transcription_segments_task_id ON public.transcription_segments(task_id);
CREATE INDEX IF NOT EXISTS idx_transcription_segments_time ON public.transcription_segments(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_transcription_segments_speaker ON public.transcription_segments(speaker_id) WHERE speaker_id IS NOT NULL;

-- 创建更新时间戳的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER update_transcription_tasks_updated_at 
  BEFORE UPDATE ON public.transcription_tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcription_stats_updated_at 
  BEFORE UPDATE ON public.transcription_stats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建统计更新函数
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
BEGIN
  -- 插入或更新今日统计
  INSERT INTO public.transcription_stats (
    date,
    total_tasks,
    completed_tasks,
    failed_tasks,
    pending_tasks,
    total_duration,
    total_segments,
    total_file_size
  )
  SELECT
    today_date,
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_tasks,
    COUNT(*) FILTER (WHERE status IN ('pending', 'processing')) as pending_tasks,
    COALESCE(SUM(duration), 0) as total_duration,
    COALESCE(SUM(segments_count), 0) as total_segments,
    COALESCE(SUM(file_size), 0) as total_file_size
  FROM public.transcription_tasks
  WHERE DATE(created_at) = today_date
  ON CONFLICT (date) DO UPDATE SET
    total_tasks = EXCLUDED.total_tasks,
    completed_tasks = EXCLUDED.completed_tasks,
    failed_tasks = EXCLUDED.failed_tasks,
    pending_tasks = EXCLUDED.pending_tasks,
    total_duration = EXCLUDED.total_duration,
    total_segments = EXCLUDED.total_segments,
    total_file_size = EXCLUDED.total_file_size,
    updated_at = NOW();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 创建统计触发器
CREATE TRIGGER update_stats_on_task_change
  AFTER INSERT OR UPDATE OR DELETE ON public.transcription_tasks
  FOR EACH STATEMENT EXECUTE FUNCTION update_daily_stats();

-- 启用 Row Level Security (可选)
-- ALTER TABLE public.transcription_tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.transcription_segments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.transcription_stats ENABLE ROW LEVEL SECURITY;

-- 创建视图：任务概览
CREATE OR REPLACE VIEW public.task_overview AS
SELECT
  t.id,
  t.created_at,
  t.status,
  t.file_name,
  t.duration,
  t.segments_count,
  t.speaker_count_detected,
  t.error,
  COUNT(s.id) as actual_segments_count
FROM public.transcription_tasks t
LEFT JOIN public.transcription_segments s ON t.id = s.task_id
GROUP BY t.id, t.created_at, t.status, t.file_name, t.duration, t.segments_count, t.speaker_count_detected, t.error
ORDER BY t.created_at DESC;

-- 创建视图：每日统计
CREATE OR REPLACE VIEW public.daily_stats AS
SELECT
  date,
  total_tasks,
  completed_tasks,
  failed_tasks,
  pending_tasks,
  CASE WHEN total_tasks > 0 
    THEN ROUND((completed_tasks::DECIMAL / total_tasks::DECIMAL) * 100, 2)
    ELSE 0 
  END as success_rate,
  total_duration,
  total_segments,
  total_file_size,
  updated_at
FROM public.transcription_stats
ORDER BY date DESC;