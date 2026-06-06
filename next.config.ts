import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `pg` ships native bindings — Next.js needs to keep it out of the
  // server bundle. Used by /api/init to run schema migrations.
  serverExternalPackages: ["pg"],

  // Bundle supabase/schema.sql into the /api/init serverless function so it
  // can read the SQL at runtime without that file being a Next.js asset.
  outputFileTracingIncludes: {
    "/api/init": ["./supabase/schema.sql"],
  },
};

export default nextConfig;
