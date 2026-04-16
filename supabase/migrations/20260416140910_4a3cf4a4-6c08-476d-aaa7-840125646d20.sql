CREATE OR REPLACE FUNCTION public.is_classroom_teacher(_classroom_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classrooms c
    WHERE c.id = _classroom_id
      AND c.teacher_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_classroom_member(_classroom_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classroom_members cm
    WHERE cm.classroom_id = _classroom_id
      AND cm.student_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_classroom(_classroom_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_classroom_teacher(_classroom_id, _user_id)
      OR public.is_classroom_member(_classroom_id, _user_id);
$$;

DROP POLICY IF EXISTS "Members can view classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Anyone can lookup classroom by invite code" ON public.classrooms;
DROP POLICY IF EXISTS "Teachers manage own classrooms" ON public.classrooms;

CREATE POLICY "Authenticated users can lookup classrooms"
ON public.classrooms
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Teachers manage own classrooms"
ON public.classrooms
FOR ALL
TO authenticated
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Students view own memberships" ON public.classroom_members;
DROP POLICY IF EXISTS "Teachers view classroom members" ON public.classroom_members;
DROP POLICY IF EXISTS "Teachers remove classroom members" ON public.classroom_members;
DROP POLICY IF EXISTS "Students can join classrooms" ON public.classroom_members;

CREATE POLICY "Students view own memberships"
ON public.classroom_members
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "Teachers view classroom members"
ON public.classroom_members
FOR SELECT
TO authenticated
USING (public.is_classroom_teacher(classroom_id, auth.uid()));

CREATE POLICY "Teachers remove classroom members"
ON public.classroom_members
FOR DELETE
TO authenticated
USING (public.is_classroom_teacher(classroom_id, auth.uid()));

CREATE POLICY "Students can join classrooms"
ON public.classroom_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Members can view announcements" ON public.announcements;
DROP POLICY IF EXISTS "Teachers manage own announcements" ON public.announcements;

CREATE POLICY "Classroom participants can view announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (public.can_access_classroom(classroom_id, auth.uid()));

CREATE POLICY "Teachers manage own announcements"
ON public.announcements
FOR ALL
TO authenticated
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);