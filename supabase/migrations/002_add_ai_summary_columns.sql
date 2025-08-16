-- 添加AI总结字段到转写任务表
ALTER TABLE public.transcription_tasks 
ADD COLUMN IF NOT EXISTS ai_summary JSONB,
ADD COLUMN IF NOT EXISTS ai_summary_generated_at TIMESTAMPTZ;

-- 添加索引以提高AI总结查询性能
CREATE INDEX IF NOT EXISTS idx_transcription_tasks_ai_summary 
ON public.transcription_tasks(ai_summary_generated_at DESC) 
WHERE ai_summary IS NOT NULL;

-- 添加注释
COMMENT ON COLUMN public.transcription_tasks.ai_summary IS 'AI生成的音频总结，包含主要议题、关键要点、说话人观点、时间线等';
COMMENT ON COLUMN public.transcription_tasks.ai_summary_generated_at IS 'AI总结生成时间戳';