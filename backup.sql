--
-- PostgreSQL database dump
--

\restrict biXYhdSRup5DoKoB3EbhI3X7I5g6yA6FFSpbMnGsEv8t7Kj3y48M2Hbf6Y2OFqg

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.6 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: prisma_migration
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO prisma_migration;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: prisma_migration
--

COMMENT ON SCHEMA public IS '';


--
-- Name: shadow_local_20250816; Type: SCHEMA; Schema: -; Owner: prisma_migration
--

CREATE SCHEMA shadow_local_20250816;


ALTER SCHEMA shadow_local_20250816 OWNER TO prisma_migration;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: prisma_migration
--

CREATE TYPE public."NotificationType" AS ENUM (
    'auth',
    'email',
    'system'
);


ALTER TYPE public."NotificationType" OWNER TO prisma_migration;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: prisma_migration
--

CREATE TYPE public."UserRole" AS ENUM (
    'user',
    'admin'
);


ALTER TYPE public."UserRole" OWNER TO prisma_migration;

--
-- Name: NotificationType; Type: TYPE; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE TYPE shadow_local_20250816."NotificationType" AS ENUM (
    'auth',
    'email',
    'system'
);


ALTER TYPE shadow_local_20250816."NotificationType" OWNER TO prisma_migration;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Account" OWNER TO prisma_migration;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "actorId" text,
    action text NOT NULL,
    entity text NOT NULL,
    summary text,
    payload jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO prisma_migration;

--
-- Name: Course; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public."Course" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    "totalLessons" integer DEFAULT 0 NOT NULL,
    description text,
    level text,
    "durationHours" integer,
    "priceINR" integer,
    points jsonb,
    "ogImage" text,
    "previewPoster" text,
    published boolean DEFAULT true NOT NULL,
    "comingSoon" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Course" OWNER TO prisma_migration;

--
-- Name: Enrollment; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public."Enrollment" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "courseId" text NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Enrollment" OWNER TO prisma_migration;

--
-- Name: Lesson; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public."Lesson" (
    id text NOT NULL,
    "courseId" text NOT NULL,
    index integer NOT NULL,
    title text NOT NULL,
    "videoUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Lesson" OWNER TO prisma_migration;

--
-- Name: LessonNote; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public."LessonNote" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "courseId" text NOT NULL,
    "lessonId" text NOT NULL,
    content text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."LessonNote" OWNER TO prisma_migration;

--
-- Name: LessonProgress; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public."LessonProgress" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "courseId" text NOT NULL,
    "lessonId" text NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    "durationSeconds" integer DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."LessonProgress" OWNER TO prisma_migration;

--
-- Name: Media; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public."Media" (
    id text NOT NULL,
    kind text NOT NULL,
    key text NOT NULL,
    url text,
    width integer,
    height integer,
    "sizeBytes" integer,
    mime text,
    "courseId" text,
    "lessonId" text,
    "userId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Media" OWNER TO prisma_migration;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    meta text,
    type public."NotificationType" DEFAULT 'system'::public."NotificationType" NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Notification" OWNER TO prisma_migration;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Session" OWNER TO prisma_migration;

--
-- Name: StreakLog; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public."StreakLog" (
    id text NOT NULL,
    "userId" text NOT NULL,
    day timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."StreakLog" OWNER TO prisma_migration;

--
-- Name: User; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text,
    email text,
    "emailVerified" timestamp(3) without time zone,
    image text,
    role public."UserRole" DEFAULT 'user'::public."UserRole" NOT NULL,
    "isAdmin" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO prisma_migration;

--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);

ALTER TABLE ONLY public."VerificationToken" REPLICA IDENTITY FULL;


ALTER TABLE public."VerificationToken" OWNER TO prisma_migration;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO prisma_migration;

--
-- Name: Account; Type: TABLE; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE TABLE shadow_local_20250816."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE shadow_local_20250816."Account" OWNER TO prisma_migration;

--
-- Name: Course; Type: TABLE; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE TABLE shadow_local_20250816."Course" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    "totalLessons" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "comingSoon" boolean DEFAULT false NOT NULL,
    description text,
    "durationHours" integer,
    level text,
    "ogImage" text,
    points jsonb,
    "previewPoster" text,
    "priceINR" integer,
    published boolean DEFAULT true NOT NULL
);


ALTER TABLE shadow_local_20250816."Course" OWNER TO prisma_migration;

--
-- Name: Enrollment; Type: TABLE; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE TABLE shadow_local_20250816."Enrollment" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "courseId" text NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE shadow_local_20250816."Enrollment" OWNER TO prisma_migration;

--
-- Name: Lesson; Type: TABLE; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE TABLE shadow_local_20250816."Lesson" (
    id text NOT NULL,
    "courseId" text NOT NULL,
    index integer NOT NULL,
    title text NOT NULL,
    "videoUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE shadow_local_20250816."Lesson" OWNER TO prisma_migration;

--
-- Name: LessonNote; Type: TABLE; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE TABLE shadow_local_20250816."LessonNote" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "courseId" text NOT NULL,
    "lessonId" text NOT NULL,
    content text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE shadow_local_20250816."LessonNote" OWNER TO prisma_migration;

--
-- Name: LessonProgress; Type: TABLE; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE TABLE shadow_local_20250816."LessonProgress" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "courseId" text NOT NULL,
    "lessonId" text NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    "durationSeconds" integer DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE shadow_local_20250816."LessonProgress" OWNER TO prisma_migration;

--
-- Name: Notification; Type: TABLE; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE TABLE shadow_local_20250816."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    meta text,
    type shadow_local_20250816."NotificationType" DEFAULT 'system'::shadow_local_20250816."NotificationType" NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE shadow_local_20250816."Notification" OWNER TO prisma_migration;

--
-- Name: Session; Type: TABLE; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE TABLE shadow_local_20250816."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE shadow_local_20250816."Session" OWNER TO prisma_migration;

--
-- Name: StreakLog; Type: TABLE; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE TABLE shadow_local_20250816."StreakLog" (
    id text NOT NULL,
    "userId" text NOT NULL,
    day timestamp(3) without time zone NOT NULL
);


ALTER TABLE shadow_local_20250816."StreakLog" OWNER TO prisma_migration;

--
-- Name: User; Type: TABLE; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE TABLE shadow_local_20250816."User" (
    id text NOT NULL,
    name text,
    email text,
    "emailVerified" timestamp(3) without time zone,
    image text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE shadow_local_20250816."User" OWNER TO prisma_migration;

--
-- Name: VerificationToken; Type: TABLE; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE TABLE shadow_local_20250816."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE shadow_local_20250816."VerificationToken" OWNER TO prisma_migration;

--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public."AuditLog" (id, "actorId", action, entity, summary, payload, "createdAt") FROM stdin;
\.


--
-- Data for Name: Course; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public."Course" (id, title, slug, "totalLessons", description, level, "durationHours", "priceINR", points, "ogImage", "previewPoster", published, "comingSoon", "createdAt", "updatedAt", "deletedAt") FROM stdin;
cmeio0br30001g1fpx6yf0l1u	JavaScript Foundations	js-foundations	0	Start from zero and build solid JavaScript foundations with hands-on exercises and projects.	Beginner	24	699	["Syntax & Types", "Functions & Scope", "Async & Promises", "Arrays & Objects"]	/og/js-foundations.png	/posters/js-foundations.png	t	f	2025-08-19 14:54:39.999	2025-08-19 14:54:39.999	\N
cmeio0f0q0016g1fp37h28wtt	React Essentials	react-essentials	0	Master React fundamentals and patterns to build real-world UIs confidently.	Intermediate	18	999	["Components & Props", "Hooks", "State & Effects", "Routing"]	/og/react-essentials.png	/posters/react-essentials.png	t	f	2025-08-19 14:54:44.234	2025-08-19 14:54:44.234	\N
cmeio0hrl0027g1fpqwdmrszw	Java Fundamentals	java-fundamentals	0	Solid Java foundations with OOP, Collections, Generics, and more.	Beginner	28	899	["OOP", "Collections", "Exceptions"]	/og/java-fundamentals.png	/posters/java-fundamentals.png	t	t	2025-08-19 14:54:47.794	2025-08-19 14:54:47.794	\N
\.


--
-- Data for Name: Enrollment; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public."Enrollment" (id, "userId", "courseId", "startedAt", "deletedAt") FROM stdin;
cmeio0hvy0029g1fpwy9dzucl	cmeio0bjb0000g1fppq0r6zn9	cmeio0br30001g1fpx6yf0l1u	2025-08-19 14:54:47.951	\N
cmeio0i15002bg1fpv5sopfdq	cmeio0bjb0000g1fppq0r6zn9	cmeio0f0q0016g1fp37h28wtt	2025-08-19 14:54:48.138	\N
\.


--
-- Data for Name: Lesson; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public."Lesson" (id, "courseId", index, title, "videoUrl", "createdAt", "updatedAt", "deletedAt") FROM stdin;
cmeio0c150003g1fpbtyal0qf	cmeio0br30001g1fpx6yf0l1u	1	Lesson 1	\N	2025-08-19 14:54:40.362	2025-08-19 14:54:40.362	\N
cmeio0c5w0005g1fp24ptvo7p	cmeio0br30001g1fpx6yf0l1u	2	Lesson 2	\N	2025-08-19 14:54:40.532	2025-08-19 14:54:40.532	\N
cmeio0cao0007g1fpy9ptjtzh	cmeio0br30001g1fpx6yf0l1u	3	Lesson 3	\N	2025-08-19 14:54:40.704	2025-08-19 14:54:40.704	\N
cmeio0ckq0009g1fpswvvg3ms	cmeio0br30001g1fpx6yf0l1u	4	Lesson 4	\N	2025-08-19 14:54:41.067	2025-08-19 14:54:41.067	\N
cmeio0csp000bg1fpfueae45c	cmeio0br30001g1fpx6yf0l1u	5	Lesson 5	\N	2025-08-19 14:54:41.353	2025-08-19 14:54:41.353	\N
cmeio0d09000dg1fpvi7znx51	cmeio0br30001g1fpx6yf0l1u	6	Lesson 6	\N	2025-08-19 14:54:41.625	2025-08-19 14:54:41.625	\N
cmeio0d6s000fg1fph8voujom	cmeio0br30001g1fpx6yf0l1u	7	Lesson 7	\N	2025-08-19 14:54:41.86	2025-08-19 14:54:41.86	\N
cmeio0das000hg1fp9ctj556b	cmeio0br30001g1fpx6yf0l1u	8	Lesson 8	\N	2025-08-19 14:54:42.004	2025-08-19 14:54:42.004	\N
cmeio0df6000jg1fpi9djcei6	cmeio0br30001g1fpx6yf0l1u	9	Lesson 9	\N	2025-08-19 14:54:42.162	2025-08-19 14:54:42.162	\N
cmeio0djy000lg1fphudj2brr	cmeio0br30001g1fpx6yf0l1u	10	Lesson 10	\N	2025-08-19 14:54:42.334	2025-08-19 14:54:42.334	\N
cmeio0dnw000ng1fplb1l2gce	cmeio0br30001g1fpx6yf0l1u	11	Lesson 11	\N	2025-08-19 14:54:42.476	2025-08-19 14:54:42.476	\N
cmeio0ds7000pg1fpgrcxh8sj	cmeio0br30001g1fpx6yf0l1u	12	Lesson 12	\N	2025-08-19 14:54:42.632	2025-08-19 14:54:42.632	\N
cmeio0dwk000rg1fp9vrhbfut	cmeio0br30001g1fpx6yf0l1u	13	Lesson 13	\N	2025-08-19 14:54:42.789	2025-08-19 14:54:42.789	\N
cmeio0e3v000tg1fp7s4kt0m2	cmeio0br30001g1fpx6yf0l1u	14	Lesson 14	\N	2025-08-19 14:54:43.051	2025-08-19 14:54:43.051	\N
cmeio0eba000vg1fpybn8srni	cmeio0br30001g1fpx6yf0l1u	15	Lesson 15	\N	2025-08-19 14:54:43.319	2025-08-19 14:54:43.319	\N
cmeio0ef8000xg1fpf4l1383m	cmeio0br30001g1fpx6yf0l1u	16	Lesson 16	\N	2025-08-19 14:54:43.46	2025-08-19 14:54:43.46	\N
cmeio0ejn000zg1fpzdkatefq	cmeio0br30001g1fpx6yf0l1u	17	Lesson 17	\N	2025-08-19 14:54:43.619	2025-08-19 14:54:43.619	\N
cmeio0env0011g1fp9azyzgv4	cmeio0br30001g1fpx6yf0l1u	18	Lesson 18	\N	2025-08-19 14:54:43.772	2025-08-19 14:54:43.772	\N
cmeio0erv0013g1fpoj1ozz3m	cmeio0br30001g1fpx6yf0l1u	19	Lesson 19	\N	2025-08-19 14:54:43.915	2025-08-19 14:54:43.915	\N
cmeio0ewi0015g1fph8zk9fqr	cmeio0br30001g1fpx6yf0l1u	20	Lesson 20	\N	2025-08-19 14:54:44.082	2025-08-19 14:54:44.082	\N
cmeio0f4x0018g1fp3m3sdtiu	cmeio0f0q0016g1fp37h28wtt	1	Lesson 1	\N	2025-08-19 14:54:44.385	2025-08-19 14:54:44.385	\N
cmeio0f9b001ag1fpo6zy8k6y	cmeio0f0q0016g1fp37h28wtt	2	Lesson 2	\N	2025-08-19 14:54:44.543	2025-08-19 14:54:44.543	\N
cmeio0fe8001cg1fprqaayiuh	cmeio0f0q0016g1fp37h28wtt	3	Lesson 3	\N	2025-08-19 14:54:44.721	2025-08-19 14:54:44.721	\N
cmeio0fif001eg1fpcfi9bcpt	cmeio0f0q0016g1fp37h28wtt	4	Lesson 4	\N	2025-08-19 14:54:44.872	2025-08-19 14:54:44.872	\N
cmeio0fn6001gg1fpun4dkbjh	cmeio0f0q0016g1fp37h28wtt	5	Lesson 5	\N	2025-08-19 14:54:45.042	2025-08-19 14:54:45.042	\N
cmeio0frv001ig1fptxxgjref	cmeio0f0q0016g1fp37h28wtt	6	Lesson 6	\N	2025-08-19 14:54:45.211	2025-08-19 14:54:45.211	\N
cmeio0g0o001kg1fp3k1izxd9	cmeio0f0q0016g1fp37h28wtt	7	Lesson 7	\N	2025-08-19 14:54:45.528	2025-08-19 14:54:45.528	\N
cmeio0g66001mg1fpj19y6eo4	cmeio0f0q0016g1fp37h28wtt	8	Lesson 8	\N	2025-08-19 14:54:45.727	2025-08-19 14:54:45.727	\N
cmeio0gdi001og1fprgue8qtr	cmeio0f0q0016g1fp37h28wtt	9	Lesson 9	\N	2025-08-19 14:54:45.99	2025-08-19 14:54:45.99	\N
cmeio0ghr001qg1fpy4ge6k9t	cmeio0f0q0016g1fp37h28wtt	10	Lesson 10	\N	2025-08-19 14:54:46.143	2025-08-19 14:54:46.143	\N
cmeio0gme001sg1fpkyryv85w	cmeio0f0q0016g1fp37h28wtt	11	Lesson 11	\N	2025-08-19 14:54:46.31	2025-08-19 14:54:46.31	\N
cmeio0gr2001ug1fprx7p1btv	cmeio0f0q0016g1fp37h28wtt	12	Lesson 12	\N	2025-08-19 14:54:46.478	2025-08-19 14:54:46.478	\N
cmeio0gvh001wg1fppkcmd0we	cmeio0f0q0016g1fp37h28wtt	13	Lesson 13	\N	2025-08-19 14:54:46.638	2025-08-19 14:54:46.638	\N
cmeio0h3i001yg1fpt9lt7su0	cmeio0f0q0016g1fp37h28wtt	14	Lesson 14	\N	2025-08-19 14:54:46.926	2025-08-19 14:54:46.926	\N
cmeio0hae0020g1fpnvs5848y	cmeio0f0q0016g1fp37h28wtt	15	Lesson 15	\N	2025-08-19 14:54:47.174	2025-08-19 14:54:47.174	\N
cmeio0heq0022g1fp5l976i64	cmeio0f0q0016g1fp37h28wtt	16	Lesson 16	\N	2025-08-19 14:54:47.331	2025-08-19 14:54:47.331	\N
cmeio0hip0024g1fppndv25e3	cmeio0f0q0016g1fp37h28wtt	17	Lesson 17	\N	2025-08-19 14:54:47.473	2025-08-19 14:54:47.473	\N
cmeio0hnd0026g1fpzkbpozkf	cmeio0f0q0016g1fp37h28wtt	18	Lesson 18	\N	2025-08-19 14:54:47.641	2025-08-19 14:54:47.641	\N
\.


--
-- Data for Name: LessonNote; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public."LessonNote" (id, "userId", "courseId", "lessonId", content, "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: LessonProgress; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public."LessonProgress" (id, "userId", "courseId", "lessonId", completed, "durationSeconds", "updatedAt", "deletedAt") FROM stdin;
cmeio0i5m002cg1fpt76m9hvg	cmeio0bjb0000g1fppq0r6zn9	cmeio0br30001g1fpx6yf0l1u	cmeio0c150003g1fpbtyal0qf	t	630	2025-08-19 14:54:48.298	\N
cmeio0i5m002dg1fpcdwmtxgo	cmeio0bjb0000g1fppq0r6zn9	cmeio0br30001g1fpx6yf0l1u	cmeio0c5w0005g1fp24ptvo7p	t	660	2025-08-19 14:54:48.298	\N
cmeio0ia1002eg1fpwsfy5rbq	cmeio0bjb0000g1fppq0r6zn9	cmeio0f0q0016g1fp37h28wtt	cmeio0f4x0018g1fp3m3sdtiu	t	630	2025-08-19 14:54:48.457	\N
\.


--
-- Data for Name: Media; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public."Media" (id, kind, key, url, width, height, "sizeBytes", mime, "courseId", "lessonId", "userId", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public."Notification" (id, "userId", title, meta, type, read, "createdAt", "deletedAt") FROM stdin;
cmeio0ijj002hg1fpy9k285hr	cmeio0bjb0000g1fppq0r6zn9	Welcome to DirectPlay	Email · just now	email	f	2025-08-19 14:54:48.799	\N
cmeio0ijj002ig1fp5ima1uz0	cmeio0bjb0000g1fppq0r6zn9	Signed in securely	Auth · 2m ago	auth	f	2025-08-19 14:54:48.799	\N
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public."Session" (id, "sessionToken", "userId", expires, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: StreakLog; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public."StreakLog" (id, "userId", day, "deletedAt") FROM stdin;
cmeio0iep002fg1fp3oea3vw3	cmeio0bjb0000g1fppq0r6zn9	2025-08-17 18:30:00	\N
cmeio0iep002gg1fpoa5p0sc1	cmeio0bjb0000g1fppq0r6zn9	2025-08-18 18:30:00	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public."User" (id, name, email, "emailVerified", image, role, "isAdmin", "createdAt", "updatedAt", "deletedAt") FROM stdin;
cmeio0bjb0000g1fppq0r6zn9	dhanushpettugani	dhanushpettugani@gmail.com	\N	\N	user	f	2025-08-19 14:54:39.719	2025-08-19 14:54:39.719	\N
\.


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public."VerificationToken" (identifier, token, expires) FROM stdin;
dhanushpettugani@gmail.com	1fba259933c7e49461df47d7821fbbbe5bd20922c479aa81dde2612752e67ba4	2025-08-19 15:24:55.397
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
db0e7e47-cc63-4f3c-9f8f-e6b0de4ff398	f53a155eab23574661a6816c81460f351f765f949dbd82e9c9fd4c3f636fedce	2025-08-19 15:23:36.500252+00	20250814115940_init_auth		\N	2025-08-19 15:23:36.500252+00	0
ddf912a4-0857-4a94-a94d-4640417f39f2	017c9c0a37f2f6fc29f3d098b1f3ac7f85169940045af5149737c0a9e17e1661	2025-08-19 15:23:40.445088+00	20250815_verificationtoken_replica_identity		\N	2025-08-19 15:23:40.445088+00	0
871b50b6-e305-4079-aa54-7462e0371722	4b230897e28641fdaab9baa9d60199952faa05abab20dece960cce81a4dae770	2025-08-19 15:23:43.935873+00	20250817052239_dashboard_base		\N	2025-08-19 15:23:43.935873+00	0
b3791a9c-c6e1-45e0-8cfe-fe1a68c7ec76	095f322bc61e706b3cfef8d3b921ceda1a2021b20fd4136444c81292edd6ac16	2025-08-19 15:23:47.121333+00	20250817101841_lesson_notes		\N	2025-08-19 15:23:47.121333+00	0
591fc771-887a-4e34-aee3-6459588b7885	1c1b224313c5929a20d95aeef24f74ebfca4d4ce2c116cccf3c3ae8d4339dc01	2025-08-19 15:23:50.804109+00	20250817142102_add_lesson_model		\N	2025-08-19 15:23:50.804109+00	0
8ffad384-9f2c-4f98-9796-5f69cc8da36c	45f2532d70fd67210dc90691cd26aeb7be1f25f6ecf95cfc1277af90882ec219	2025-08-19 15:23:54.760623+00	20250817173110_add_course_marketing_fields		\N	2025-08-19 15:23:54.760623+00	0
952ad6d8-a108-4b9f-b411-6f20012dc83d	499550cf001385462ccc063ee3993cf36cbeff91d2c279e7c8f52f87dcc01b47	2025-08-19 15:23:57.800037+00	20250819205025_verificationtoken_replica_identity		\N	2025-08-19 15:23:57.800037+00	0
33aeb68c-8ef9-4276-b420-5f4e736a62ae	499550cf001385462ccc063ee3993cf36cbeff91d2c279e7c8f52f87dcc01b47	2025-08-19 15:24:00.728603+00	20250819205101_verificationtoken_replica_identity		\N	2025-08-19 15:24:00.728603+00	0
\.


--
-- Data for Name: Account; Type: TABLE DATA; Schema: shadow_local_20250816; Owner: prisma_migration
--

COPY shadow_local_20250816."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Course; Type: TABLE DATA; Schema: shadow_local_20250816; Owner: prisma_migration
--

COPY shadow_local_20250816."Course" (id, title, slug, "totalLessons", "createdAt", "updatedAt", "comingSoon", description, "durationHours", level, "ogImage", points, "previewPoster", "priceINR", published) FROM stdin;
\.


--
-- Data for Name: Enrollment; Type: TABLE DATA; Schema: shadow_local_20250816; Owner: prisma_migration
--

COPY shadow_local_20250816."Enrollment" (id, "userId", "courseId", "startedAt") FROM stdin;
\.


--
-- Data for Name: Lesson; Type: TABLE DATA; Schema: shadow_local_20250816; Owner: prisma_migration
--

COPY shadow_local_20250816."Lesson" (id, "courseId", index, title, "videoUrl", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LessonNote; Type: TABLE DATA; Schema: shadow_local_20250816; Owner: prisma_migration
--

COPY shadow_local_20250816."LessonNote" (id, "userId", "courseId", "lessonId", content, "updatedAt") FROM stdin;
\.


--
-- Data for Name: LessonProgress; Type: TABLE DATA; Schema: shadow_local_20250816; Owner: prisma_migration
--

COPY shadow_local_20250816."LessonProgress" (id, "userId", "courseId", "lessonId", completed, "durationSeconds", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: shadow_local_20250816; Owner: prisma_migration
--

COPY shadow_local_20250816."Notification" (id, "userId", title, meta, type, read, "createdAt") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: shadow_local_20250816; Owner: prisma_migration
--

COPY shadow_local_20250816."Session" (id, "sessionToken", "userId", expires, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: StreakLog; Type: TABLE DATA; Schema: shadow_local_20250816; Owner: prisma_migration
--

COPY shadow_local_20250816."StreakLog" (id, "userId", day) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: shadow_local_20250816; Owner: prisma_migration
--

COPY shadow_local_20250816."User" (id, name, email, "emailVerified", image, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: shadow_local_20250816; Owner: prisma_migration
--

COPY shadow_local_20250816."VerificationToken" (identifier, token, expires) FROM stdin;
\.


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: Course Course_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_pkey" PRIMARY KEY (id);


--
-- Name: Enrollment Enrollment_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."Enrollment"
    ADD CONSTRAINT "Enrollment_pkey" PRIMARY KEY (id);


--
-- Name: LessonNote LessonNote_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."LessonNote"
    ADD CONSTRAINT "LessonNote_pkey" PRIMARY KEY (id);


--
-- Name: LessonProgress LessonProgress_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."LessonProgress"
    ADD CONSTRAINT "LessonProgress_pkey" PRIMARY KEY (id);


--
-- Name: Lesson Lesson_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."Lesson"
    ADD CONSTRAINT "Lesson_pkey" PRIMARY KEY (id);


--
-- Name: Media Media_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT "Media_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: StreakLog StreakLog_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."StreakLog"
    ADD CONSTRAINT "StreakLog_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: Course Course_pkey; Type: CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."Course"
    ADD CONSTRAINT "Course_pkey" PRIMARY KEY (id);


--
-- Name: Enrollment Enrollment_pkey; Type: CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."Enrollment"
    ADD CONSTRAINT "Enrollment_pkey" PRIMARY KEY (id);


--
-- Name: LessonNote LessonNote_pkey; Type: CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."LessonNote"
    ADD CONSTRAINT "LessonNote_pkey" PRIMARY KEY (id);


--
-- Name: LessonProgress LessonProgress_pkey; Type: CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."LessonProgress"
    ADD CONSTRAINT "LessonProgress_pkey" PRIMARY KEY (id);


--
-- Name: Lesson Lesson_pkey; Type: CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."Lesson"
    ADD CONSTRAINT "Lesson_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: StreakLog StreakLog_pkey; Type: CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."StreakLog"
    ADD CONSTRAINT "StreakLog_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: Account_userId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "Account_userId_idx" ON public."Account" USING btree ("userId");


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: Course_slug_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX "Course_slug_key" ON public."Course" USING btree (slug);


--
-- Name: Enrollment_courseId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "Enrollment_courseId_idx" ON public."Enrollment" USING btree ("courseId");


--
-- Name: Enrollment_userId_courseId_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON public."Enrollment" USING btree ("userId", "courseId");


--
-- Name: Enrollment_userId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "Enrollment_userId_idx" ON public."Enrollment" USING btree ("userId");


--
-- Name: LessonNote_courseId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "LessonNote_courseId_idx" ON public."LessonNote" USING btree ("courseId");


--
-- Name: LessonNote_lessonId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "LessonNote_lessonId_idx" ON public."LessonNote" USING btree ("lessonId");


--
-- Name: LessonNote_userId_courseId_lessonId_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX "LessonNote_userId_courseId_lessonId_key" ON public."LessonNote" USING btree ("userId", "courseId", "lessonId");


--
-- Name: LessonNote_userId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "LessonNote_userId_idx" ON public."LessonNote" USING btree ("userId");


--
-- Name: LessonProgress_courseId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "LessonProgress_courseId_idx" ON public."LessonProgress" USING btree ("courseId");


--
-- Name: LessonProgress_lessonId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "LessonProgress_lessonId_idx" ON public."LessonProgress" USING btree ("lessonId");


--
-- Name: LessonProgress_userId_courseId_lessonId_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX "LessonProgress_userId_courseId_lessonId_key" ON public."LessonProgress" USING btree ("userId", "courseId", "lessonId");


--
-- Name: LessonProgress_userId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "LessonProgress_userId_idx" ON public."LessonProgress" USING btree ("userId");


--
-- Name: Lesson_courseId_index_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "Lesson_courseId_index_idx" ON public."Lesson" USING btree ("courseId", index);


--
-- Name: Lesson_courseId_index_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX "Lesson_courseId_index_key" ON public."Lesson" USING btree ("courseId", index);


--
-- Name: Media_courseId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "Media_courseId_idx" ON public."Media" USING btree ("courseId");


--
-- Name: Media_lessonId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "Media_lessonId_idx" ON public."Media" USING btree ("lessonId");


--
-- Name: Media_userId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "Media_userId_idx" ON public."Media" USING btree ("userId");


--
-- Name: Notification_createdAt_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "Notification_createdAt_idx" ON public."Notification" USING btree ("createdAt");


--
-- Name: Notification_userId_read_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "Notification_userId_read_idx" ON public."Notification" USING btree ("userId", read);


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


--
-- Name: StreakLog_userId_day_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX "StreakLog_userId_day_key" ON public."StreakLog" USING btree ("userId", day);


--
-- Name: StreakLog_userId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "StreakLog_userId_idx" ON public."StreakLog" USING btree ("userId");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON shadow_local_20250816."Account" USING btree (provider, "providerAccountId");


--
-- Name: Account_userId_idx; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE INDEX "Account_userId_idx" ON shadow_local_20250816."Account" USING btree ("userId");


--
-- Name: Course_slug_key; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE UNIQUE INDEX "Course_slug_key" ON shadow_local_20250816."Course" USING btree (slug);


--
-- Name: Enrollment_courseId_idx; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE INDEX "Enrollment_courseId_idx" ON shadow_local_20250816."Enrollment" USING btree ("courseId");


--
-- Name: Enrollment_userId_courseId_key; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON shadow_local_20250816."Enrollment" USING btree ("userId", "courseId");


--
-- Name: Enrollment_userId_idx; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE INDEX "Enrollment_userId_idx" ON shadow_local_20250816."Enrollment" USING btree ("userId");


--
-- Name: LessonNote_courseId_idx; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE INDEX "LessonNote_courseId_idx" ON shadow_local_20250816."LessonNote" USING btree ("courseId");


--
-- Name: LessonNote_lessonId_idx; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE INDEX "LessonNote_lessonId_idx" ON shadow_local_20250816."LessonNote" USING btree ("lessonId");


--
-- Name: LessonNote_userId_courseId_lessonId_key; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE UNIQUE INDEX "LessonNote_userId_courseId_lessonId_key" ON shadow_local_20250816."LessonNote" USING btree ("userId", "courseId", "lessonId");


--
-- Name: LessonNote_userId_idx; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE INDEX "LessonNote_userId_idx" ON shadow_local_20250816."LessonNote" USING btree ("userId");


--
-- Name: LessonProgress_courseId_idx; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE INDEX "LessonProgress_courseId_idx" ON shadow_local_20250816."LessonProgress" USING btree ("courseId");


--
-- Name: LessonProgress_lessonId_idx; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE INDEX "LessonProgress_lessonId_idx" ON shadow_local_20250816."LessonProgress" USING btree ("lessonId");


--
-- Name: LessonProgress_userId_courseId_lessonId_key; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE UNIQUE INDEX "LessonProgress_userId_courseId_lessonId_key" ON shadow_local_20250816."LessonProgress" USING btree ("userId", "courseId", "lessonId");


--
-- Name: LessonProgress_userId_idx; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE INDEX "LessonProgress_userId_idx" ON shadow_local_20250816."LessonProgress" USING btree ("userId");


--
-- Name: Lesson_courseId_index_idx; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE INDEX "Lesson_courseId_index_idx" ON shadow_local_20250816."Lesson" USING btree ("courseId", index);


--
-- Name: Lesson_courseId_index_key; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE UNIQUE INDEX "Lesson_courseId_index_key" ON shadow_local_20250816."Lesson" USING btree ("courseId", index);


--
-- Name: Notification_createdAt_idx; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE INDEX "Notification_createdAt_idx" ON shadow_local_20250816."Notification" USING btree ("createdAt");


--
-- Name: Notification_userId_read_idx; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE INDEX "Notification_userId_read_idx" ON shadow_local_20250816."Notification" USING btree ("userId", read);


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON shadow_local_20250816."Session" USING btree ("sessionToken");


--
-- Name: Session_userId_idx; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE INDEX "Session_userId_idx" ON shadow_local_20250816."Session" USING btree ("userId");


--
-- Name: StreakLog_userId_day_key; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE UNIQUE INDEX "StreakLog_userId_day_key" ON shadow_local_20250816."StreakLog" USING btree ("userId", day);


--
-- Name: StreakLog_userId_idx; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE INDEX "StreakLog_userId_idx" ON shadow_local_20250816."StreakLog" USING btree ("userId");


--
-- Name: User_email_idx; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE INDEX "User_email_idx" ON shadow_local_20250816."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE UNIQUE INDEX "User_email_key" ON shadow_local_20250816."User" USING btree (email);


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON shadow_local_20250816."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: shadow_local_20250816; Owner: prisma_migration
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON shadow_local_20250816."VerificationToken" USING btree (token);


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog AuditLog_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Enrollment Enrollment_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."Enrollment"
    ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Enrollment Enrollment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."Enrollment"
    ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LessonNote LessonNote_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."LessonNote"
    ADD CONSTRAINT "LessonNote_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LessonNote LessonNote_lessonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."LessonNote"
    ADD CONSTRAINT "LessonNote_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES public."Lesson"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LessonNote LessonNote_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."LessonNote"
    ADD CONSTRAINT "LessonNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LessonProgress LessonProgress_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."LessonProgress"
    ADD CONSTRAINT "LessonProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LessonProgress LessonProgress_lessonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."LessonProgress"
    ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES public."Lesson"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LessonProgress LessonProgress_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."LessonProgress"
    ADD CONSTRAINT "LessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Lesson Lesson_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."Lesson"
    ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Media Media_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT "Media_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Media Media_lessonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT "Media_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES public."Lesson"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Media Media_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT "Media_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StreakLog StreakLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public."StreakLog"
    ADD CONSTRAINT "StreakLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES shadow_local_20250816."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Enrollment Enrollment_courseId_fkey; Type: FK CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."Enrollment"
    ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES shadow_local_20250816."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Enrollment Enrollment_userId_fkey; Type: FK CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."Enrollment"
    ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES shadow_local_20250816."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LessonNote LessonNote_courseId_fkey; Type: FK CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."LessonNote"
    ADD CONSTRAINT "LessonNote_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES shadow_local_20250816."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LessonNote LessonNote_lessonId_fkey; Type: FK CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."LessonNote"
    ADD CONSTRAINT "LessonNote_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES shadow_local_20250816."Lesson"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LessonNote LessonNote_userId_fkey; Type: FK CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."LessonNote"
    ADD CONSTRAINT "LessonNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES shadow_local_20250816."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LessonProgress LessonProgress_courseId_fkey; Type: FK CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."LessonProgress"
    ADD CONSTRAINT "LessonProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES shadow_local_20250816."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LessonProgress LessonProgress_lessonId_fkey; Type: FK CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."LessonProgress"
    ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES shadow_local_20250816."Lesson"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LessonProgress LessonProgress_userId_fkey; Type: FK CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."LessonProgress"
    ADD CONSTRAINT "LessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES shadow_local_20250816."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Lesson Lesson_courseId_fkey; Type: FK CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."Lesson"
    ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES shadow_local_20250816."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES shadow_local_20250816."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES shadow_local_20250816."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StreakLog StreakLog_userId_fkey; Type: FK CONSTRAINT; Schema: shadow_local_20250816; Owner: prisma_migration
--

ALTER TABLE ONLY shadow_local_20250816."StreakLog"
    ADD CONSTRAINT "StreakLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES shadow_local_20250816."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: all_models; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION all_models FOR ALL TABLES WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION all_models OWNER TO postgres;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: prisma_migration
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict biXYhdSRup5DoKoB3EbhI3X7I5g6yA6FFSpbMnGsEv8t7Kj3y48M2Hbf6Y2OFqg

