import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://yaqvqybffdlxjrvyclto.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhcXZxeWJmZmRseGpydnljbHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODE2ODIsImV4cCI6MjA5MTA1NzY4Mn0.x3pDYZ4PT-UoQfTkMcM5_uaaQ9zpg14VufxtW8sMw0U'
)
