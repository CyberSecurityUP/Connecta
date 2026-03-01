import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",

  database: {
    url: process.env.DATABASE_URL || "postgresql://connecta:connectapass@localhost:5432/connectadb",
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  auth: {
    secret: process.env.NEXTAUTH_SECRET || "development-secret",
    accessTokenExpiry: "15m",
    refreshTokenExpiry: "7d",
  },

  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
  },

  upload: {
    dir: process.env.UPLOAD_DIR || "./uploads",
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "26214400", 10), // 25MB
  },

  email: {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "noreply@example.com",
  },
} as const;
