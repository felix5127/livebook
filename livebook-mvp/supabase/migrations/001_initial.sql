-- Create tasks table for storing transcription tasks
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    duration FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create segments table for storing transcription results
CREATE TABLE segments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    start_time FLOAT NOT NULL,
    end_time FLOAT NOT NULL,
    confidence FLOAT,
    speaker VARCHAR(50),
    segment_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_segments_task_id ON segments(task_id);
CREATE INDEX idx_segments_start_time ON segments(start_time);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for tasks table
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- INSERT INTO tasks (file_name, file_size, file_type, status) 
-- VALUES ('sample_audio.mp3', 1048576, 'audio/mp3', 'completed');

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE segments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
-- CREATE POLICY "Allow public read access on tasks" ON tasks FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert access on tasks" ON tasks FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public update access on tasks" ON tasks FOR UPDATE USING (true);

-- CREATE POLICY "Allow public read access on segments" ON segments FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert access on segments" ON segments FOR INSERT WITH CHECK (true);