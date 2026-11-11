-- Jalankan di Supabase SQL Editor setelah login Supabase berhasil.
-- Kebijakan tambahan ini tidak menghapus kebijakan yang sudah ada.

-- Akun terautentikasi perlu membaca profil untuk menampilkan nama partner.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_read_all_authenticated'
  ) THEN
    CREATE POLICY "profiles_read_all_authenticated"
      ON public.profiles FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Semua pengguna login boleh membaca daftar jenis pekerjaan; perubahan tetap admin-only.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='job_types' AND policyname='job_types_read_authenticated_v1'
  ) THEN
    CREATE POLICY "job_types_read_authenticated_v1"
      ON public.job_types FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Helper SECURITY DEFINER menghindari RLS berulang antara tickets dan ticket_workers.
CREATE OR REPLACE FUNCTION public.can_access_ticket(target_ticket_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tickets t
    WHERE t.id = target_ticket_id
      AND (
        t.created_by = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.ticket_workers tw
          WHERE tw.ticket_id = t.id
            AND tw.technician_id = (SELECT auth.uid())
        )
      )
  );
$$;
GRANT EXECUTE ON FUNCTION public.can_access_ticket(bigint) TO authenticated;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tickets' AND policyname='tickets_read_creator_assigned_admin_v1'
  ) THEN
    CREATE POLICY "tickets_read_creator_assigned_admin_v1"
      ON public.tickets FOR SELECT TO authenticated
      USING (public.is_admin() OR public.can_access_ticket(id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tickets' AND policyname='tickets_delete_creator_admin_v1'
  ) THEN
    CREATE POLICY "tickets_delete_creator_admin_v1"
      ON public.tickets FOR DELETE TO authenticated
      USING (public.is_admin() OR created_by = (SELECT auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ticket_workers' AND policyname='ticket_workers_read_assigned_admin_v1'
  ) THEN
    CREATE POLICY "ticket_workers_read_assigned_admin_v1"
      ON public.ticket_workers FOR SELECT TO authenticated
      USING (
        public.is_admin()
        OR technician_id = (SELECT auth.uid())
        OR public.can_access_ticket(ticket_id)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ticket_workers' AND policyname='ticket_workers_insert_ticket_creator_admin_v1'
  ) THEN
    CREATE POLICY "ticket_workers_insert_ticket_creator_admin_v1"
      ON public.ticket_workers FOR INSERT TO authenticated
      WITH CHECK (
        public.is_admin()
        OR EXISTS (
          SELECT 1 FROM public.tickets t
          WHERE t.id = ticket_id
            AND t.created_by = (SELECT auth.uid())
        )
      );
  END IF;
END $$;
