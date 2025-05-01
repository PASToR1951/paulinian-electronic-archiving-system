--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-04-30 23:39:26

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
-- TOC entry 875 (class 1247 OID 139671)
-- Name: document_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.document_type AS ENUM (
    'THESIS',
    'DISSERTATION',
    'CONFLUENCE',
    'SYNERGY'
);


ALTER TYPE public.document_type OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 139679)
-- Name: authors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.authors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    spud_id character varying(50),
    full_name character varying(255) NOT NULL,
    affiliation character varying(255),
    department character varying(255),
    email character varying(255),
    orcid_id character varying(255),
    biography text,
    profile_picture character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.authors OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 139730)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    category_name character varying(255) NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 139729)
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- TOC entry 5115 (class 0 OID 0)
-- Dependencies: 220
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- TOC entry 246 (class 1259 OID 140144)
-- Name: compiled_document_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.compiled_document_items (
    id integer NOT NULL,
    compiled_document_id integer,
    document_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.compiled_document_items OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 140143)
-- Name: compiled_document_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.compiled_document_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.compiled_document_items_id_seq OWNER TO postgres;

--
-- TOC entry 5116 (class 0 OID 0)
-- Dependencies: 245
-- Name: compiled_document_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.compiled_document_items_id_seq OWNED BY public.compiled_document_items.id;


--
-- TOC entry 244 (class 1259 OID 140134)
-- Name: compiled_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.compiled_documents (
    id integer NOT NULL,
    start_year integer,
    end_year integer,
    volume integer,
    issue_number integer,
    department character varying(255),
    category character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.compiled_documents OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 140133)
-- Name: compiled_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.compiled_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.compiled_documents_id_seq OWNER TO postgres;

--
-- TOC entry 5117 (class 0 OID 0)
-- Dependencies: 243
-- Name: compiled_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.compiled_documents_id_seq OWNED BY public.compiled_documents.id;


--
-- TOC entry 235 (class 1259 OID 139862)
-- Name: credentials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.credentials (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    password text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.credentials OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 139861)
-- Name: credentials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.credentials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.credentials_id_seq OWNER TO postgres;

--
-- TOC entry 5118 (class 0 OID 0)
-- Dependencies: 234
-- Name: credentials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.credentials_id_seq OWNED BY public.credentials.id;


--
-- TOC entry 223 (class 1259 OID 139739)
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    department_name character varying(255) NOT NULL,
    code character varying(10)
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 139738)
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- TOC entry 5119 (class 0 OID 0)
-- Dependencies: 222
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- TOC entry 226 (class 1259 OID 139783)
-- Name: document_authors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_authors (
    document_id integer NOT NULL,
    author_id uuid NOT NULL,
    author_order integer NOT NULL
);


ALTER TABLE public.document_authors OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 139915)
-- Name: document_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_permissions (
    id integer NOT NULL,
    document_id integer NOT NULL,
    user_id character varying,
    role_id integer,
    can_view boolean DEFAULT false,
    can_download boolean DEFAULT false,
    can_manage boolean DEFAULT false,
    granted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    granted_by character varying,
    CONSTRAINT document_permissions_check CHECK ((((user_id IS NOT NULL) AND (role_id IS NULL)) OR ((user_id IS NULL) AND (role_id IS NOT NULL))))
);


ALTER TABLE public.document_permissions OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 139914)
-- Name: document_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.document_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.document_permissions_id_seq OWNER TO postgres;

--
-- TOC entry 5120 (class 0 OID 0)
-- Dependencies: 239
-- Name: document_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.document_permissions_id_seq OWNED BY public.document_permissions.id;


--
-- TOC entry 229 (class 1259 OID 139807)
-- Name: document_research_agenda; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_research_agenda (
    document_id integer NOT NULL,
    research_agenda_id integer NOT NULL
);


ALTER TABLE public.document_research_agenda OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 139762)
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    abstract text,
    publication_date date,
    start_year integer,
    end_year integer,
    category_id integer,
    department_id integer,
    file_path text NOT NULL,
    pages integer,
    is_public boolean DEFAULT false,
    document_type public.document_type NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    volume character varying(50),
    issue character varying(50)
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 139761)
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO postgres;

--
-- TOC entry 5121 (class 0 OID 0)
-- Dependencies: 224
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- TOC entry 231 (class 1259 OID 139823)
-- Name: files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.files (
    id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    file_type character varying(50),
    document_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.files OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 139822)
-- Name: files_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.files_id_seq OWNER TO postgres;

--
-- TOC entry 5122 (class 0 OID 0)
-- Dependencies: 230
-- Name: files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.files_id_seq OWNED BY public.files.id;


--
-- TOC entry 228 (class 1259 OID 139799)
-- Name: research_agenda; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.research_agenda (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.research_agenda OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 139798)
-- Name: research_agenda_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.research_agenda_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.research_agenda_id_seq OWNER TO postgres;

--
-- TOC entry 5123 (class 0 OID 0)
-- Dependencies: 227
-- Name: research_agenda_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.research_agenda_id_seq OWNED BY public.research_agenda.id;


--
-- TOC entry 219 (class 1259 OID 139709)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    role_name character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 139708)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- TOC entry 5124 (class 0 OID 0)
-- Dependencies: 218
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 242 (class 1259 OID 140116)
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    user_id character varying(50) NOT NULL,
    token text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 140115)
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sessions_id_seq OWNER TO postgres;

--
-- TOC entry 5125 (class 0 OID 0)
-- Dependencies: 241
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- TOC entry 238 (class 1259 OID 139896)
-- Name: user_document_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_document_history (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    document_id integer NOT NULL,
    accessed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    action character varying(20) NOT NULL,
    CONSTRAINT user_document_history_action_check CHECK (((action)::text = ANY ((ARRAY['VIEW'::character varying, 'DOWNLOAD'::character varying])::text[])))
);


ALTER TABLE public.user_document_history OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 139895)
-- Name: user_document_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_document_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_document_history_id_seq OWNER TO postgres;

--
-- TOC entry 5126 (class 0 OID 0)
-- Dependencies: 237
-- Name: user_document_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_document_history_id_seq OWNED BY public.user_document_history.id;


--
-- TOC entry 236 (class 1259 OID 139879)
-- Name: user_saved_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_saved_documents (
    user_id character varying NOT NULL,
    document_id integer NOT NULL,
    saved_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_saved_documents OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 139840)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    first_name character varying(50),
    middle_name character varying(50),
    last_name character varying(50),
    email character varying(255),
    department_id integer,
    role_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 139839)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5127 (class 0 OID 0)
-- Dependencies: 232
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4825 (class 2604 OID 139733)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 4852 (class 2604 OID 140147)
-- Name: compiled_document_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compiled_document_items ALTER COLUMN id SET DEFAULT nextval('public.compiled_document_items_id_seq'::regclass);


--
-- TOC entry 4850 (class 2604 OID 140137)
-- Name: compiled_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compiled_documents ALTER COLUMN id SET DEFAULT nextval('public.compiled_documents_id_seq'::regclass);


--
-- TOC entry 4837 (class 2604 OID 139865)
-- Name: credentials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credentials ALTER COLUMN id SET DEFAULT nextval('public.credentials_id_seq'::regclass);


--
-- TOC entry 4826 (class 2604 OID 139742)
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- TOC entry 4843 (class 2604 OID 139918)
-- Name: document_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_permissions ALTER COLUMN id SET DEFAULT nextval('public.document_permissions_id_seq'::regclass);


--
-- TOC entry 4827 (class 2604 OID 139765)
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- TOC entry 4832 (class 2604 OID 139826)
-- Name: files id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files ALTER COLUMN id SET DEFAULT nextval('public.files_id_seq'::regclass);


--
-- TOC entry 4831 (class 2604 OID 139802)
-- Name: research_agenda id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.research_agenda ALTER COLUMN id SET DEFAULT nextval('public.research_agenda_id_seq'::regclass);


--
-- TOC entry 4824 (class 2604 OID 139712)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 4848 (class 2604 OID 140119)
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- TOC entry 4841 (class 2604 OID 139899)
-- Name: user_document_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_document_history ALTER COLUMN id SET DEFAULT nextval('public.user_document_history_id_seq'::regclass);


--
-- TOC entry 4835 (class 2604 OID 140013)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5080 (class 0 OID 139679)
-- Dependencies: 217
-- Data for Name: authors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.authors (id, spud_id, full_name, affiliation, department, email, orcid_id, biography, profile_picture, created_at, updated_at) FROM stdin;
79d45eac-9022-4a18-8786-a579f9ab3293	202312345	Juan Dela Cruz	St. Paul University	Computer Science Department	juan.delacruz@example.com	0000-0001-2345-6789	Juan is a researcher in AI and data science.	juan_profile.jpg	2025-04-29 23:30:30.463785	2025-04-29 23:30:30.463785
e0beab9a-3d35-48d7-8c79-a8edc7dafb0d	\N	Cj Anadon	\N	\N	\N	\N	\N	\N	2025-04-30 01:27:09.999015	2025-04-30 01:27:09.999015
8d1dd1a2-cb32-4c9d-ace0-7601e8aeb5fc	\N	PapaJesus	\N	\N	\N	\N	\N	\N	2025-04-30 01:27:17.160613	2025-04-30 01:27:17.160613
70ce26c9-efb7-4354-bc7e-090e22e1d408	\N	adan	\N	\N	\N	\N	\N	\N	2025-04-30 04:20:54.082969	2025-04-30 04:20:54.082969
53dde85a-e688-42e4-8992-4ea173e19310	\N	Hello	\N	\N	\N	\N	\N	\N	2025-04-30 04:21:19.293923	2025-04-30 04:21:19.293923
6aab86e6-57d0-41fd-9baf-8f1866da72da	\N	Marian	\N	\N	\N	\N	\N	\N	2025-04-30 11:31:37.112105	2025-04-30 11:31:37.112105
fa0dc001-ffbf-4d12-969f-346e5f448ca5	\N	Grace	\N	\N	\N	\N	\N	\N	2025-04-30 11:31:41.836414	2025-04-30 11:31:41.836414
270bf61d-f6ce-4e52-a52e-4a9893bbe3ff	\N	Kurt	\N	\N	\N	\N	\N	\N	2025-04-30 11:56:44.239667	2025-04-30 11:56:44.239667
\.


--
-- TOC entry 5084 (class 0 OID 139730)
-- Dependencies: 221
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, category_name) FROM stdin;
1	Confluence
2	Synergy
3	Thesis
4	Dissertation
\.


--
-- TOC entry 5109 (class 0 OID 140144)
-- Dependencies: 246
-- Data for Name: compiled_document_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.compiled_document_items (id, compiled_document_id, document_id, created_at) FROM stdin;
\.


--
-- TOC entry 5107 (class 0 OID 140134)
-- Dependencies: 244
-- Data for Name: compiled_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.compiled_documents (id, start_year, end_year, volume, issue_number, department, category, created_at) FROM stdin;
\.


--
-- TOC entry 5098 (class 0 OID 139862)
-- Dependencies: 235
-- Data for Name: credentials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.credentials (id, user_id, password, created_at, updated_at) FROM stdin;
1	admin-01	admin123	2025-04-29 17:16:24.237644	2025-04-29 17:16:24.237644
2	spud-01	user123	2025-04-29 17:16:24.237644	2025-04-29 17:16:24.237644
\.


--
-- TOC entry 5086 (class 0 OID 139739)
-- Dependencies: 223
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, department_name, code) FROM stdin;
1	College of Business Information Technology	CBIT
2	College of Nursing	CON
3	Basic Academic Education	BAED
4	College of Arts and Science Education	CASE
\.


--
-- TOC entry 5089 (class 0 OID 139783)
-- Dependencies: 226
-- Data for Name: document_authors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_authors (document_id, author_id, author_order) FROM stdin;
38	e0beab9a-3d35-48d7-8c79-a8edc7dafb0d	1
\.


--
-- TOC entry 5103 (class 0 OID 139915)
-- Dependencies: 240
-- Data for Name: document_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_permissions (id, document_id, user_id, role_id, can_view, can_download, can_manage, granted_at, granted_by) FROM stdin;
\.


--
-- TOC entry 5092 (class 0 OID 139807)
-- Dependencies: 229
-- Data for Name: document_research_agenda; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_research_agenda (document_id, research_agenda_id) FROM stdin;
\.


--
-- TOC entry 5088 (class 0 OID 139762)
-- Dependencies: 225
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, title, description, abstract, publication_date, start_year, end_year, category_id, department_id, file_path, pages, is_public, document_type, created_at, updated_at, deleted_at, volume, issue) FROM stdin;
37	Synergy 7	\N	\N	\N	2017	2018	4	2	storage/compiled/synergy/	\N	t	SYNERGY	2025-04-30 14:44:26.25754	2025-04-30 14:44:26.25754	\N	7	\N
38	single sample	\N	Extracting abstract from file...	2000-01-01	\N	\N	1	\N	storage\\single\\thesis\\1745995916511_3185	\N	t	THESIS	2025-04-30 14:51:56.526754	2025-04-30 14:51:56.526754	\N	\N	\N
39	Confluence 9	\N	\N	\N	2003	2004	3	\N	storage/compiled/confluence/	\N	t	CONFLUENCE	2025-04-30 14:52:57.785628	2025-04-30 14:52:57.785628	\N	9	3
40	Confluence 13	\N	\N	\N	2017	2018	3	\N	storage/compiled/confluence/	\N	t	CONFLUENCE	2025-04-30 17:04:02.572284	2025-04-30 17:04:02.572284	\N	13	1
41	Confluence 5	\N	\N	\N	2001	2002	3	\N	storage/compiled/confluence/	\N	t	CONFLUENCE	2025-04-30 23:31:29.792349	2025-04-30 23:31:29.792349	\N	5	1
\.


--
-- TOC entry 5094 (class 0 OID 139823)
-- Dependencies: 231
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.files (id, file_name, file_path, file_size, file_type, document_id, created_at, updated_at) FROM stdin;
11	file	storage\\single\\thesis\\1745995916511_3185	379315	other	38	2025-04-30 14:51:56.572278	2025-04-30 14:51:56.572278
\.


--
-- TOC entry 5091 (class 0 OID 139799)
-- Dependencies: 228
-- Data for Name: research_agenda; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.research_agenda (id, name) FROM stdin;
1	Health and Wellness
2	Technology and Innovation
3	Education and Literacy
4	Environmental Sustainability
5	Community Development
6	God Bless Senpols
7	Hello kitty
8	Sistaarr!!!
9	Vhal
10	art
11	christian
12	ert
\.


--
-- TOC entry 5082 (class 0 OID 139709)
-- Dependencies: 219
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, role_name) FROM stdin;
1	ADMIN
2	USER
3	GUEST
\.


--
-- TOC entry 5105 (class 0 OID 140116)
-- Dependencies: 242
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, token, created_at, expires_at) FROM stdin;
3	admin-01	7933bb00-c20e-4e8f-bde6-8600107f1d26	2025-04-30 00:23:13.02164	2025-05-01 00:23:13.02
4	admin-01	bc7a43c9-bffe-4de4-8681-12150e03c315	2025-04-30 00:32:07.992992	2025-05-01 00:32:07.991
5	admin-01	9a4b9840-5e1e-4839-9df4-6214f42bead5	2025-04-30 00:38:34.90445	2025-05-01 00:38:34.901
6	admin-01	255ee871-6a0d-49d1-91f3-36d6003a62c1	2025-04-30 00:45:55.604224	2025-05-01 00:45:55.603
7	admin-01	947d2bc6-531d-49aa-acba-5bdf36c5015d	2025-04-30 00:49:06.194604	2025-05-01 00:49:06.193
8	admin-01	681c6a26-6856-49da-adf3-6350f131634b	2025-04-30 00:57:16.204613	2025-05-01 00:57:16.203
9	admin-01	e669235a-cc17-45da-82ae-43712411cb5b	2025-04-30 00:59:53.860356	2025-05-01 00:59:53.859
10	admin-01	2413e4f5-ecc9-4ea8-bb9f-07b63bf302ba	2025-04-30 01:09:49.707658	2025-05-01 01:09:49.706
11	admin-01	7636f753-b792-41f7-aa0c-395e4c20108e	2025-04-30 01:14:57.559729	2025-05-01 01:14:57.558
12	admin-01	14f5bc48-40e6-4251-aa26-90dcb190ec3f	2025-04-30 01:27:00.977198	2025-05-01 01:27:00.975
13	admin-01	66447b18-8c15-45bc-99a7-691ffa8effe1	2025-04-30 01:35:37.841522	2025-05-01 01:35:37.84
14	admin-01	71f292a6-1d3c-48df-a23c-dec3ae930f7e	2025-04-30 01:48:27.729126	2025-05-01 01:48:27.727
15	admin-01	1a760da2-d84a-4bcf-ad20-f2d2abe72c13	2025-04-30 01:54:50.751402	2025-05-01 01:54:50.749
16	admin-01	d16638d6-df1e-4c8a-9ecb-7a7450239566	2025-04-30 02:09:21.838076	2025-05-01 02:09:21.836
17	admin-01	cae9fea8-6365-4c61-ab32-e140b26eb7fe	2025-04-30 02:13:33.588558	2025-05-01 02:13:33.587
18	admin-01	e5da3d2e-6877-4048-b4f8-d57dba4ecfba	2025-04-30 02:18:53.159104	2025-05-01 02:18:53.157
19	admin-01	0dca9600-218e-4c17-86df-5e2f87ac500b	2025-04-30 02:48:13.746729	2025-05-01 02:48:13.744
20	admin-01	0facdb9a-aba6-4a4e-813c-dd670e685881	2025-04-30 03:03:40.94671	2025-05-01 03:03:40.944
21	admin-01	263e90b6-601d-40ca-b757-bdc791827590	2025-04-30 03:23:11.611154	2025-05-01 03:23:11.609
22	admin-01	e42fd74e-905f-43e9-96eb-957b52cf6de6	2025-04-30 03:35:48.072646	2025-05-01 03:35:48.071
23	admin-01	7fd9811d-cc82-4bb5-978a-4d28fd786b31	2025-04-30 03:39:31.031101	2025-05-01 03:39:31.029
24	admin-01	d91c4a62-c91f-4351-981c-cd20237cbc52	2025-04-30 03:43:47.463683	2025-05-01 03:43:47.462
25	admin-01	6b0f3527-b725-4a16-81fe-3ef94663f8ed	2025-04-30 03:48:04.799694	2025-05-01 03:48:04.798
26	admin-01	a55f79e9-b31a-4334-b3da-8189811ea415	2025-04-30 03:52:11.035257	2025-05-01 03:52:11.032
27	admin-01	e4f0c1c7-0f75-4c30-92ee-5883376a67b4	2025-04-30 04:00:07.579642	2025-05-01 04:00:07.577
28	admin-01	c543d2f0-d09f-4f98-a162-4fdb31161bad	2025-04-30 04:10:22.237028	2025-05-01 04:10:22.235
29	admin-01	14ba8f81-7ed8-4cf1-993f-fb56cf813411	2025-04-30 04:15:09.27759	2025-05-01 04:15:09.276
30	admin-01	246a72ca-a2ff-4d8c-bcc1-66e028783baf	2025-04-30 04:20:30.376423	2025-05-01 04:20:30.374
31	admin-01	ad1b3e2a-dac7-4725-9730-72058ab879a9	2025-04-30 04:26:43.982945	2025-05-01 04:26:43.981
32	admin-01	58d4d3fd-596c-463e-be73-3aa6bbc7b8b7	2025-04-30 04:31:53.847647	2025-05-01 04:31:53.846
33	admin-01	ed2fb53b-71d2-46b2-8f58-9c3af641b252	2025-04-30 04:43:45.049785	2025-05-01 04:43:45.048
34	admin-01	24171a8c-c683-46cd-95c1-595590d81898	2025-04-30 04:49:59.215665	2025-05-01 04:49:59.214
35	admin-01	b8db8798-f65e-47be-8cb4-6d11bdff5fce	2025-04-30 04:57:36.330392	2025-05-01 04:57:36.329
36	admin-01	e8c4977e-083b-4f21-a656-89b5c9eaa56b	2025-04-30 05:09:13.556287	2025-05-01 05:09:13.554
37	admin-01	1555f312-78e9-4b0a-9893-c790a74c81bf	2025-04-30 05:28:57.072282	2025-05-01 05:28:57.07
38	admin-01	6e82af98-a29a-41a3-8d0b-e3f9f45bd53d	2025-04-30 08:56:48.089703	2025-05-01 08:56:48.088
39	admin-01	530f844a-6d80-4248-b3ec-f7eb86ae1ebd	2025-04-30 09:06:26.589505	2025-05-01 09:06:26.587
40	admin-01	b9751545-44da-451d-a159-dcee1acfb6c3	2025-04-30 09:55:42.59198	2025-05-01 09:55:42.59
41	admin-01	b2875ac5-7957-4331-95cd-b690bc9a71bd	2025-04-30 10:12:49.738673	2025-05-01 10:12:49.737
42	admin-01	5a9b0dcd-3398-44bf-8aba-2fbca934bb17	2025-04-30 10:40:04.556847	2025-05-01 10:40:04.555
43	admin-01	38761b2e-3d27-4a72-bad9-9990a901d6a0	2025-04-30 10:59:23.053797	2025-05-01 10:59:23.052
44	admin-01	b7a618a5-6e77-492b-a901-e273a810c1e5	2025-04-30 11:06:43.504296	2025-05-01 11:06:43.502
45	admin-01	2ca9b9f6-9f0d-4fd2-88ec-3a943159299f	2025-04-30 11:27:29.73688	2025-05-01 11:27:29.735
46	admin-01	243db12b-b179-41dc-b2a1-8487ad1d4b3f	2025-04-30 11:31:21.273639	2025-05-01 11:31:21.272
47	admin-01	d62809a5-ccbe-419b-82a2-5de16f45c3fd	2025-04-30 11:37:17.819179	2025-05-01 11:37:17.817
48	admin-01	81c867e8-2017-4872-81cc-c16448cff0ae	2025-04-30 11:40:56.693075	2025-05-01 11:40:56.691
49	admin-01	8cebca76-33b0-4eeb-be8b-fe6fcbdc9ff5	2025-04-30 11:46:26.003733	2025-05-01 11:46:26.002
50	admin-01	66665bb0-17bd-4dcb-98ff-17d1b8d7937d	2025-04-30 11:54:22.796486	2025-05-01 11:54:22.794
52	admin-01	7e02f50c-b084-4c65-b318-ddec01534b1d	2025-04-30 12:22:14.463715	2025-05-01 12:22:14.462
53	admin-01	be0050d9-63ab-4492-8a1a-fd8cafa754b2	2025-04-30 12:24:36.335251	2025-05-01 12:24:36.333
54	admin-01	8d0fd263-d88c-4ea7-997b-4a2e090bae56	2025-04-30 12:44:18.904572	2025-05-01 12:44:18.902
55	admin-01	77b627b5-c1df-4631-9f90-6619a6c4acb5	2025-04-30 12:47:33.906253	2025-05-01 12:47:33.904
56	admin-01	e3f3aafa-3785-4e29-9631-aedc02e1c001	2025-04-30 12:49:43.138011	2025-05-01 12:49:43.135
57	admin-01	4ea896b9-fa95-4a4c-81b9-b48848f9b5ed	2025-04-30 13:13:28.883032	2025-05-01 13:13:28.881
58	admin-01	f343553c-31db-44ee-bd3b-b4e0a1cdd767	2025-04-30 13:25:19.301143	2025-05-01 13:25:19.299
59	admin-01	05550f10-534e-4b11-891e-120b245228b7	2025-04-30 13:44:12.286593	2025-05-01 13:44:12.285
60	admin-01	286c49ad-35ad-486e-b213-5ab7798594a3	2025-04-30 13:49:53.622058	2025-05-01 13:49:53.62
61	admin-01	d647a3f2-076a-442a-8315-4ffb7fe7f52f	2025-04-30 13:53:47.320142	2025-05-01 13:53:47.319
62	admin-01	f6acd337-9a4e-446d-a952-dfdd6890c14a	2025-04-30 13:56:20.834698	2025-05-01 13:56:20.833
63	admin-01	0a1a3edc-819f-4b26-af7a-750109dc8161	2025-04-30 14:02:59.728484	2025-05-01 14:02:59.726
64	admin-01	96de8ba6-af9d-4710-932a-cf281f944016	2025-04-30 14:12:29.033693	2025-05-01 14:12:29.031
65	admin-01	325fbd58-dc1a-43ca-849d-ca63098ac08e	2025-04-30 14:14:33.034416	2025-05-01 14:14:33.033
66	admin-01	b3d34f22-4fe9-4d6c-be2e-009e15f3d49d	2025-04-30 14:22:01.746404	2025-05-01 14:22:01.744
67	admin-01	2f8ba647-62ee-4454-85bf-d416f3b55c82	2025-04-30 14:25:54.574611	2025-05-01 14:25:54.573
68	admin-01	f80a524a-f61a-4d5c-be9f-a99dc4fdbac6	2025-04-30 14:40:08.898709	2025-05-01 14:40:08.897
69	admin-01	47362048-e93b-4e2e-9380-8f5a5197ff22	2025-04-30 14:43:52.283571	2025-05-01 14:43:52.282
70	admin-01	e4002767-c2de-4b11-b3ae-6d26d15c74f2	2025-04-30 14:45:21.420508	2025-05-01 14:45:21.418
71	admin-01	ce0b52e9-15bf-40e7-80f5-75695c3b23f0	2025-04-30 14:47:01.173185	2025-05-01 14:47:01.171
72	admin-01	a84295f9-7cbb-403a-8490-e3376b7a98ef	2025-04-30 14:54:05.981965	2025-05-01 14:54:05.98
73	admin-01	4e403128-2fa1-4f4c-955f-a9341bb5857d	2025-04-30 14:58:04.269401	2025-05-01 14:58:04.267
74	admin-01	50ad4e1b-78cd-44fe-8e3a-79c9de544831	2025-04-30 15:01:29.486265	2025-05-01 15:01:29.485
75	admin-01	8a43b314-0923-4f88-86b9-85cf741b90d3	2025-04-30 15:57:10.836071	2025-05-01 15:57:10.834
76	admin-01	76855119-954c-40fd-b23b-aac10ba5672f	2025-04-30 17:03:09.31909	2025-05-01 17:03:09.318
77	admin-01	a3651a37-1ccf-4b32-84ca-aee878488926	2025-04-30 23:30:34.061067	2025-05-01 23:30:34.059
\.


--
-- TOC entry 5101 (class 0 OID 139896)
-- Dependencies: 238
-- Data for Name: user_document_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_document_history (id, user_id, document_id, accessed_at, action) FROM stdin;
\.


--
-- TOC entry 5099 (class 0 OID 139879)
-- Dependencies: 236
-- Data for Name: user_saved_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_saved_documents (user_id, document_id, saved_at) FROM stdin;
\.


--
-- TOC entry 5096 (class 0 OID 139840)
-- Dependencies: 233
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, first_name, middle_name, last_name, email, department_id, role_id, created_at, last_login) FROM stdin;
admin-01	Admin	M	User	admin@example.com	1	1	2025-04-29 15:19:33.059118	\N
spud-01	John	D	Doe	john.doe@example.com	2	2	2025-04-29 15:19:33.059118	\N
\.


--
-- TOC entry 5128 (class 0 OID 0)
-- Dependencies: 220
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 4, true);


--
-- TOC entry 5129 (class 0 OID 0)
-- Dependencies: 245
-- Name: compiled_document_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.compiled_document_items_id_seq', 1, false);


--
-- TOC entry 5130 (class 0 OID 0)
-- Dependencies: 243
-- Name: compiled_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.compiled_documents_id_seq', 1, false);


--
-- TOC entry 5131 (class 0 OID 0)
-- Dependencies: 234
-- Name: credentials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.credentials_id_seq', 2, true);


--
-- TOC entry 5132 (class 0 OID 0)
-- Dependencies: 222
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 4, true);


--
-- TOC entry 5133 (class 0 OID 0)
-- Dependencies: 239
-- Name: document_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_permissions_id_seq', 1, false);


--
-- TOC entry 5134 (class 0 OID 0)
-- Dependencies: 224
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 41, true);


--
-- TOC entry 5135 (class 0 OID 0)
-- Dependencies: 230
-- Name: files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.files_id_seq', 11, true);


--
-- TOC entry 5136 (class 0 OID 0)
-- Dependencies: 227
-- Name: research_agenda_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.research_agenda_id_seq', 12, true);


--
-- TOC entry 5137 (class 0 OID 0)
-- Dependencies: 218
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- TOC entry 5138 (class 0 OID 0)
-- Dependencies: 241
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sessions_id_seq', 77, true);


--
-- TOC entry 5139 (class 0 OID 0)
-- Dependencies: 237
-- Name: user_document_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_document_history_id_seq', 1, false);


--
-- TOC entry 5140 (class 0 OID 0)
-- Dependencies: 232
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- TOC entry 4857 (class 2606 OID 139688)
-- Name: authors authors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.authors
    ADD CONSTRAINT authors_pkey PRIMARY KEY (id);


--
-- TOC entry 4859 (class 2606 OID 139690)
-- Name: authors authors_spud_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.authors
    ADD CONSTRAINT authors_spud_id_key UNIQUE (spud_id);


--
-- TOC entry 4867 (class 2606 OID 139737)
-- Name: categories categories_category_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_category_name_key UNIQUE (category_name);


--
-- TOC entry 4869 (class 2606 OID 139735)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4913 (class 2606 OID 140150)
-- Name: compiled_document_items compiled_document_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compiled_document_items
    ADD CONSTRAINT compiled_document_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4911 (class 2606 OID 140142)
-- Name: compiled_documents compiled_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compiled_documents
    ADD CONSTRAINT compiled_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 4897 (class 2606 OID 139871)
-- Name: credentials credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credentials
    ADD CONSTRAINT credentials_pkey PRIMARY KEY (id);


--
-- TOC entry 4899 (class 2606 OID 140045)
-- Name: credentials credentials_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credentials
    ADD CONSTRAINT credentials_user_id_key UNIQUE (user_id);


--
-- TOC entry 4871 (class 2606 OID 139748)
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- TOC entry 4873 (class 2606 OID 139746)
-- Name: departments departments_department_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_department_name_key UNIQUE (department_name);


--
-- TOC entry 4875 (class 2606 OID 139744)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- TOC entry 4879 (class 2606 OID 139787)
-- Name: document_authors document_authors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_authors
    ADD CONSTRAINT document_authors_pkey PRIMARY KEY (document_id, author_id);


--
-- TOC entry 4905 (class 2606 OID 139925)
-- Name: document_permissions document_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_permissions
    ADD CONSTRAINT document_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4887 (class 2606 OID 139811)
-- Name: document_research_agenda document_research_agenda_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_research_agenda
    ADD CONSTRAINT document_research_agenda_pkey PRIMARY KEY (document_id, research_agenda_id);


--
-- TOC entry 4877 (class 2606 OID 139772)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 4891 (class 2606 OID 139832)
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- TOC entry 4883 (class 2606 OID 139806)
-- Name: research_agenda research_agenda_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.research_agenda
    ADD CONSTRAINT research_agenda_name_key UNIQUE (name);


--
-- TOC entry 4885 (class 2606 OID 139804)
-- Name: research_agenda research_agenda_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.research_agenda
    ADD CONSTRAINT research_agenda_pkey PRIMARY KEY (id);


--
-- TOC entry 4863 (class 2606 OID 139714)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4865 (class 2606 OID 139716)
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 4907 (class 2606 OID 140124)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4909 (class 2606 OID 140126)
-- Name: sessions sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key UNIQUE (token);


--
-- TOC entry 4903 (class 2606 OID 139903)
-- Name: user_document_history user_document_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_document_history
    ADD CONSTRAINT user_document_history_pkey PRIMARY KEY (id);


--
-- TOC entry 4901 (class 2606 OID 140027)
-- Name: user_saved_documents user_saved_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_saved_documents
    ADD CONSTRAINT user_saved_documents_pkey PRIMARY KEY (user_id, document_id);


--
-- TOC entry 4893 (class 2606 OID 139850)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4895 (class 2606 OID 140015)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4860 (class 1259 OID 140101)
-- Name: idx_authors_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_authors_email ON public.authors USING btree (email);


--
-- TOC entry 4861 (class 1259 OID 140100)
-- Name: idx_authors_full_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_authors_full_name ON public.authors USING btree (full_name);


--
-- TOC entry 4880 (class 1259 OID 140103)
-- Name: idx_document_authors_author_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_authors_author_id ON public.document_authors USING btree (author_id);


--
-- TOC entry 4881 (class 1259 OID 140102)
-- Name: idx_document_authors_document_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_authors_document_id ON public.document_authors USING btree (document_id);


--
-- TOC entry 4888 (class 1259 OID 140104)
-- Name: idx_document_research_agenda_document_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_research_agenda_document_id ON public.document_research_agenda USING btree (document_id);


--
-- TOC entry 4889 (class 1259 OID 140105)
-- Name: idx_document_research_agenda_research_agenda_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_research_agenda_research_agenda_id ON public.document_research_agenda USING btree (research_agenda_id);


--
-- TOC entry 4933 (class 2606 OID 140151)
-- Name: compiled_document_items compiled_document_items_compiled_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compiled_document_items
    ADD CONSTRAINT compiled_document_items_compiled_document_id_fkey FOREIGN KEY (compiled_document_id) REFERENCES public.compiled_documents(id) ON DELETE CASCADE;


--
-- TOC entry 4934 (class 2606 OID 140156)
-- Name: compiled_document_items compiled_document_items_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compiled_document_items
    ADD CONSTRAINT compiled_document_items_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4923 (class 2606 OID 140078)
-- Name: credentials credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credentials
    ADD CONSTRAINT credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4916 (class 2606 OID 139793)
-- Name: document_authors document_authors_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_authors
    ADD CONSTRAINT document_authors_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.authors(id) ON DELETE CASCADE;


--
-- TOC entry 4917 (class 2606 OID 139788)
-- Name: document_authors document_authors_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_authors
    ADD CONSTRAINT document_authors_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4928 (class 2606 OID 139926)
-- Name: document_permissions document_permissions_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_permissions
    ADD CONSTRAINT document_permissions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4929 (class 2606 OID 140088)
-- Name: document_permissions document_permissions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_permissions
    ADD CONSTRAINT document_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(id);


--
-- TOC entry 4930 (class 2606 OID 139936)
-- Name: document_permissions document_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_permissions
    ADD CONSTRAINT document_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 4931 (class 2606 OID 140083)
-- Name: document_permissions document_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_permissions
    ADD CONSTRAINT document_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4918 (class 2606 OID 139812)
-- Name: document_research_agenda document_research_agenda_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_research_agenda
    ADD CONSTRAINT document_research_agenda_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4919 (class 2606 OID 139817)
-- Name: document_research_agenda document_research_agenda_research_agenda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_research_agenda
    ADD CONSTRAINT document_research_agenda_research_agenda_id_fkey FOREIGN KEY (research_agenda_id) REFERENCES public.research_agenda(id);


--
-- TOC entry 4914 (class 2606 OID 139773)
-- Name: documents documents_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- TOC entry 4915 (class 2606 OID 139778)
-- Name: documents documents_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- TOC entry 4920 (class 2606 OID 139833)
-- Name: files files_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4932 (class 2606 OID 140127)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4926 (class 2606 OID 139909)
-- Name: user_document_history user_document_history_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_document_history
    ADD CONSTRAINT user_document_history_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4927 (class 2606 OID 140073)
-- Name: user_document_history user_document_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_document_history
    ADD CONSTRAINT user_document_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4924 (class 2606 OID 139890)
-- Name: user_saved_documents user_saved_documents_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_saved_documents
    ADD CONSTRAINT user_saved_documents_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4925 (class 2606 OID 140068)
-- Name: user_saved_documents user_saved_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_saved_documents
    ADD CONSTRAINT user_saved_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4921 (class 2606 OID 139851)
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- TOC entry 4922 (class 2606 OID 139856)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


-- Completed on 2025-04-30 23:39:26

--
-- PostgreSQL database dump complete
--

