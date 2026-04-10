
-- Create classrooms table
CREATE TABLE public.classrooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  teacher_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create classroom_members table
CREATE TABLE public.classroom_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, student_id)
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Classrooms policies
CREATE POLICY "Teachers manage own classrooms"
  ON public.classrooms FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Members can view classrooms"
  ON public.classrooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classroom_members cm
      WHERE cm.classroom_id = classrooms.id AND cm.student_id = auth.uid()
    )
  );

-- Allow anyone authenticated to read a classroom by invite_code (for joining)
CREATE POLICY "Anyone can lookup classroom by invite code"
  ON public.classrooms FOR SELECT
  USING (auth.role() = 'authenticated');

-- Classroom members policies
CREATE POLICY "Students can join classrooms"
  ON public.classroom_members FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students view own memberships"
  ON public.classroom_members FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers view classroom members"
  ON public.classroom_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms c
      WHERE c.id = classroom_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers remove classroom members"
  ON public.classroom_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms c
      WHERE c.id = classroom_id AND c.teacher_id = auth.uid()
    )
  );

-- Announcements policies
CREATE POLICY "Teachers manage own announcements"
  ON public.announcements FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Members can view announcements"
  ON public.announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classroom_members cm
      WHERE cm.classroom_id = announcements.classroom_id AND cm.student_id = auth.uid()
    )
  );

-- Add columns to existing tables
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS grace_period INTEGER NOT NULL DEFAULT 5;
ALTER TABLE public.attendance_entries ADD COLUMN IF NOT EXISTS is_late BOOLEAN NOT NULL DEFAULT false;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.classrooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.classroom_members;
