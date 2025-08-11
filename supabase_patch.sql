
DO $$ BEGIN
  CREATE TYPE "QuestionType" AS ENUM ('SC','MC');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
  id            text PRIMARY KEY,
  email         text UNIQUE NOT NULL,
  "passwordHash" text NOT NULL,
  role          text NOT NULL DEFAULT 'ADMIN',
  "createdAt"   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "QuestionSet" (
  id           text PRIMARY KEY,
  name         text NOT NULL,
  "createdById" text NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  "createdAt"  timestamptz NOT NULL DEFAULT now(),
  "isActive"   boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS "Question" (
  id             text PRIMARY KEY,
  "questionSetId" text NOT NULL REFERENCES "QuestionSet"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  text           text NOT NULL,
  options        text[] NOT NULL,
  type           "QuestionType" NOT NULL DEFAULT 'SC',
  "correctIndices" int[] NOT NULL,
  "order"        int NOT NULL
);

CREATE TABLE IF NOT EXISTS "Quiz" (
  id               text PRIMARY KEY,
  "quizCode"       text UNIQUE NOT NULL,
  name             text NOT NULL,
  "questionSetId"  text NOT NULL REFERENCES "QuestionSet"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  "isActive"       boolean NOT NULL DEFAULT true,
  "timeLimitSeconds" int NOT NULL DEFAULT 1800,
  "questionCount"  int NOT NULL DEFAULT 20,
  "shuffleQuestions" boolean NOT NULL DEFAULT true,
  "shuffleOptions" boolean NOT NULL DEFAULT true,
  "createdById"    text NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  "createdAt"      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Participant" (
  id        text PRIMARY KEY,
  "quizId"  text NOT NULL REFERENCES "Quiz"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  name      text NOT NULL,
  email     text NOT NULL,
  mobile    text NOT NULL,
  status    text NOT NULL DEFAULT 'CREATED',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("quizId","email")
);

CREATE TABLE IF NOT EXISTS "Attempt" (
  id             text PRIMARY KEY,
  "participantId" text UNIQUE NOT NULL REFERENCES "Participant"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "startedAt"    timestamptz NOT NULL DEFAULT now(),
  "submittedAt"  timestamptz,
  score          int NOT NULL DEFAULT 0,
  "durationSeconds" int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "Answer" (
  id           text PRIMARY KEY,
  "attemptId"  text NOT NULL REFERENCES "Attempt"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "questionId" text NOT NULL REFERENCES "Question"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  selected     int[] NOT NULL,
  "isCorrect"  boolean NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_Participant_email" ON "Participant"(email);
CREATE INDEX IF NOT EXISTS "idx_Attempt_submittedAt" ON "Attempt"("submittedAt");
