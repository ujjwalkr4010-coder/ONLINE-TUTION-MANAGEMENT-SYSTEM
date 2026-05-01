
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'tutor', 'student');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE public.course_status AS ENUM ('draft', 'active', 'archived');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- ============ COURSES ============
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_url TEXT,
  status course_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- ============ ENROLLMENTS ============
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, student_id)
);
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- ============ ATTENDANCE ============
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status NOT NULL DEFAULT 'present',
  marked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, student_id, date)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ============ ASSIGNMENTS ============
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  max_marks INT NOT NULL DEFAULT 100,
  attachment_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- ============ SUBMISSIONS ============
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  marks_obtained INT,
  feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  graded_at TIMESTAMPTZ,
  UNIQUE (assignment_id, student_id)
);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- ============ PAYMENTS ============
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ============ LIVE CLASSES ============
CREATE TABLE public.live_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  meeting_room TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;

-- ============ CHAT MESSAGES (AI bot) ============
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER courses_updated BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );

  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS POLICIES ============

-- profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tutor'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- courses
CREATE POLICY "Anyone authenticated views courses" ON public.courses FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Tutors create courses" ON public.courses FOR INSERT
  WITH CHECK (auth.uid() = tutor_id AND (public.has_role(auth.uid(), 'tutor') OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Tutors update own courses" ON public.courses FOR UPDATE
  USING (auth.uid() = tutor_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Tutors delete own courses" ON public.courses FOR DELETE
  USING (auth.uid() = tutor_id OR public.has_role(auth.uid(), 'admin'));

-- enrollments
CREATE POLICY "View enrollments" ON public.enrollments FOR SELECT
  USING (auth.uid() = student_id OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.tutor_id = auth.uid()));
CREATE POLICY "Students enroll themselves" ON public.enrollments FOR INSERT
  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students unenroll" ON public.enrollments FOR DELETE
  USING (auth.uid() = student_id OR public.has_role(auth.uid(), 'admin'));

-- attendance
CREATE POLICY "View attendance" ON public.attendance FOR SELECT
  USING (auth.uid() = student_id OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.tutor_id = auth.uid()));
CREATE POLICY "Tutors mark attendance" ON public.attendance FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.tutor_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Tutors update attendance" ON public.attendance FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.tutor_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));

-- assignments
CREATE POLICY "View assignments" ON public.assignments FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Tutors create assignments" ON public.assignments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.tutor_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Tutors update assignments" ON public.assignments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.tutor_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Tutors delete assignments" ON public.assignments FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.tutor_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));

-- submissions
CREATE POLICY "View submissions" ON public.submissions FOR SELECT
  USING (auth.uid() = student_id OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.assignments a JOIN public.courses c ON c.id = a.course_id
               WHERE a.id = assignment_id AND c.tutor_id = auth.uid()));
CREATE POLICY "Students submit" ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Update submissions" ON public.submissions FOR UPDATE
  USING (auth.uid() = student_id
    OR EXISTS (SELECT 1 FROM public.assignments a JOIN public.courses c ON c.id = a.course_id
               WHERE a.id = assignment_id AND c.tutor_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));

-- payments
CREATE POLICY "View own payments" ON public.payments FOR SELECT
  USING (auth.uid() = student_id OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.tutor_id = auth.uid()));
CREATE POLICY "Students create payment" ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Update payment status" ON public.payments FOR UPDATE
  USING (auth.uid() = student_id OR public.has_role(auth.uid(), 'admin'));

-- live_classes
CREATE POLICY "View live classes" ON public.live_classes FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "Tutors schedule classes" ON public.live_classes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.tutor_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Tutors update classes" ON public.live_classes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.tutor_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Tutors delete classes" ON public.live_classes FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.tutor_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));

-- chat_messages
CREATE POLICY "Users view own messages" ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users create own messages" ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
