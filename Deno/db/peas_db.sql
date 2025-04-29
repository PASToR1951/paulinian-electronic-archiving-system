--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-04-29 23:48:29

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
-- TOC entry 871 (class 1247 OID 139671)
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
-- TOC entry 5091 (class 0 OID 0)
-- Dependencies: 220
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


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
-- TOC entry 5092 (class 0 OID 0)
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
-- TOC entry 5093 (class 0 OID 0)
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
-- TOC entry 5094 (class 0 OID 0)
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
    deleted_at timestamp without time zone
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
-- TOC entry 5095 (class 0 OID 0)
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
-- TOC entry 5096 (class 0 OID 0)
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
-- TOC entry 5097 (class 0 OID 0)
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
-- TOC entry 5098 (class 0 OID 0)
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
-- TOC entry 5099 (class 0 OID 0)
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
-- TOC entry 5100 (class 0 OID 0)
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
-- TOC entry 5101 (class 0 OID 0)
-- Dependencies: 232
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4815 (class 2604 OID 139733)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 4827 (class 2604 OID 139865)
-- Name: credentials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credentials ALTER COLUMN id SET DEFAULT nextval('public.credentials_id_seq'::regclass);


--
-- TOC entry 4816 (class 2604 OID 139742)
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- TOC entry 4833 (class 2604 OID 139918)
-- Name: document_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_permissions ALTER COLUMN id SET DEFAULT nextval('public.document_permissions_id_seq'::regclass);


--
-- TOC entry 4817 (class 2604 OID 139765)
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- TOC entry 4822 (class 2604 OID 139826)
-- Name: files id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files ALTER COLUMN id SET DEFAULT nextval('public.files_id_seq'::regclass);


--
-- TOC entry 4821 (class 2604 OID 139802)
-- Name: research_agenda id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.research_agenda ALTER COLUMN id SET DEFAULT nextval('public.research_agenda_id_seq'::regclass);


--
-- TOC entry 4814 (class 2604 OID 139712)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 4838 (class 2604 OID 140119)
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- TOC entry 4831 (class 2604 OID 139899)
-- Name: user_document_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_document_history ALTER COLUMN id SET DEFAULT nextval('public.user_document_history_id_seq'::regclass);


--
-- TOC entry 4825 (class 2604 OID 140013)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5060 (class 0 OID 139679)
-- Dependencies: 217
-- Data for Name: authors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.authors (id, spud_id, full_name, affiliation, department, email, orcid_id, biography, profile_picture, created_at, updated_at) FROM stdin;
79d45eac-9022-4a18-8786-a579f9ab3293	202312345	Juan Dela Cruz	St. Paul University	Computer Science Department	juan.delacruz@example.com	0000-0001-2345-6789	Juan is a researcher in AI and data science.	juan_profile.jpg	2025-04-29 23:30:30.463785	2025-04-29 23:30:30.463785
\.


--
-- TOC entry 5064 (class 0 OID 139730)
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
-- TOC entry 5078 (class 0 OID 139862)
-- Dependencies: 235
-- Data for Name: credentials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.credentials (id, user_id, password, created_at, updated_at) FROM stdin;
1	admin-01	admin123	2025-04-29 17:16:24.237644	2025-04-29 17:16:24.237644
2	spud-01	user123	2025-04-29 17:16:24.237644	2025-04-29 17:16:24.237644
\.


--
-- TOC entry 5066 (class 0 OID 139739)
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
-- TOC entry 5069 (class 0 OID 139783)
-- Dependencies: 226
-- Data for Name: document_authors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_authors (document_id, author_id, author_order) FROM stdin;
\.


--
-- TOC entry 5083 (class 0 OID 139915)
-- Dependencies: 240
-- Data for Name: document_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_permissions (id, document_id, user_id, role_id, can_view, can_download, can_manage, granted_at, granted_by) FROM stdin;
\.


--
-- TOC entry 5072 (class 0 OID 139807)
-- Dependencies: 229
-- Data for Name: document_research_agenda; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_research_agenda (document_id, research_agenda_id) FROM stdin;
\.


--
-- TOC entry 5068 (class 0 OID 139762)
-- Dependencies: 225
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, title, description, abstract, publication_date, start_year, end_year, category_id, department_id, file_path, pages, is_public, document_type, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 5074 (class 0 OID 139823)
-- Dependencies: 231
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.files (id, file_name, file_path, file_size, file_type, document_id, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5071 (class 0 OID 139799)
-- Dependencies: 228
-- Data for Name: research_agenda; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.research_agenda (id, name) FROM stdin;
\.


--
-- TOC entry 5062 (class 0 OID 139709)
-- Dependencies: 219
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, role_name) FROM stdin;
1	ADMIN
2	USER
3	GUEST
\.


--
-- TOC entry 5085 (class 0 OID 140116)
-- Dependencies: 242
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, token, created_at, expires_at) FROM stdin;
\.


--
-- TOC entry 5081 (class 0 OID 139896)
-- Dependencies: 238
-- Data for Name: user_document_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_document_history (id, user_id, document_id, accessed_at, action) FROM stdin;
\.


--
-- TOC entry 5079 (class 0 OID 139879)
-- Dependencies: 236
-- Data for Name: user_saved_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_saved_documents (user_id, document_id, saved_at) FROM stdin;
\.


--
-- TOC entry 5076 (class 0 OID 139840)
-- Dependencies: 233
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, first_name, middle_name, last_name, email, department_id, role_id, created_at, last_login) FROM stdin;
admin-01	Admin	M	User	admin@example.com	1	1	2025-04-29 15:19:33.059118	\N
spud-01	John	D	Doe	john.doe@example.com	2	2	2025-04-29 15:19:33.059118	\N
\.


--
-- TOC entry 5102 (class 0 OID 0)
-- Dependencies: 220
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 4, true);


--
-- TOC entry 5103 (class 0 OID 0)
-- Dependencies: 234
-- Name: credentials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.credentials_id_seq', 2, true);


--
-- TOC entry 5104 (class 0 OID 0)
-- Dependencies: 222
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 4, true);


--
-- TOC entry 5105 (class 0 OID 0)
-- Dependencies: 239
-- Name: document_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_permissions_id_seq', 1, false);


--
-- TOC entry 5106 (class 0 OID 0)
-- Dependencies: 224
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 1, false);


--
-- TOC entry 5107 (class 0 OID 0)
-- Dependencies: 230
-- Name: files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.files_id_seq', 1, false);


--
-- TOC entry 5108 (class 0 OID 0)
-- Dependencies: 227
-- Name: research_agenda_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.research_agenda_id_seq', 1, false);


--
-- TOC entry 5109 (class 0 OID 0)
-- Dependencies: 218
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- TOC entry 5110 (class 0 OID 0)
-- Dependencies: 241
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sessions_id_seq', 1, false);


--
-- TOC entry 5111 (class 0 OID 0)
-- Dependencies: 237
-- Name: user_document_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_document_history_id_seq', 1, false);


--
-- TOC entry 5112 (class 0 OID 0)
-- Dependencies: 232
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- TOC entry 4843 (class 2606 OID 139688)
-- Name: authors authors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.authors
    ADD CONSTRAINT authors_pkey PRIMARY KEY (id);


--
-- TOC entry 4845 (class 2606 OID 139690)
-- Name: authors authors_spud_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.authors
    ADD CONSTRAINT authors_spud_id_key UNIQUE (spud_id);


--
-- TOC entry 4853 (class 2606 OID 139737)
-- Name: categories categories_category_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_category_name_key UNIQUE (category_name);


--
-- TOC entry 4855 (class 2606 OID 139735)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4883 (class 2606 OID 139871)
-- Name: credentials credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credentials
    ADD CONSTRAINT credentials_pkey PRIMARY KEY (id);


--
-- TOC entry 4885 (class 2606 OID 140045)
-- Name: credentials credentials_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credentials
    ADD CONSTRAINT credentials_user_id_key UNIQUE (user_id);


--
-- TOC entry 4857 (class 2606 OID 139748)
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- TOC entry 4859 (class 2606 OID 139746)
-- Name: departments departments_department_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_department_name_key UNIQUE (department_name);


--
-- TOC entry 4861 (class 2606 OID 139744)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- TOC entry 4865 (class 2606 OID 139787)
-- Name: document_authors document_authors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_authors
    ADD CONSTRAINT document_authors_pkey PRIMARY KEY (document_id, author_id);


--
-- TOC entry 4891 (class 2606 OID 139925)
-- Name: document_permissions document_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_permissions
    ADD CONSTRAINT document_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4873 (class 2606 OID 139811)
-- Name: document_research_agenda document_research_agenda_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_research_agenda
    ADD CONSTRAINT document_research_agenda_pkey PRIMARY KEY (document_id, research_agenda_id);


--
-- TOC entry 4863 (class 2606 OID 139772)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 4877 (class 2606 OID 139832)
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- TOC entry 4869 (class 2606 OID 139806)
-- Name: research_agenda research_agenda_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.research_agenda
    ADD CONSTRAINT research_agenda_name_key UNIQUE (name);


--
-- TOC entry 4871 (class 2606 OID 139804)
-- Name: research_agenda research_agenda_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.research_agenda
    ADD CONSTRAINT research_agenda_pkey PRIMARY KEY (id);


--
-- TOC entry 4849 (class 2606 OID 139714)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4851 (class 2606 OID 139716)
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 4893 (class 2606 OID 140124)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4895 (class 2606 OID 140126)
-- Name: sessions sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key UNIQUE (token);


--
-- TOC entry 4889 (class 2606 OID 139903)
-- Name: user_document_history user_document_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_document_history
    ADD CONSTRAINT user_document_history_pkey PRIMARY KEY (id);


--
-- TOC entry 4887 (class 2606 OID 140027)
-- Name: user_saved_documents user_saved_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_saved_documents
    ADD CONSTRAINT user_saved_documents_pkey PRIMARY KEY (user_id, document_id);


--
-- TOC entry 4879 (class 2606 OID 139850)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4881 (class 2606 OID 140015)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4846 (class 1259 OID 140101)
-- Name: idx_authors_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_authors_email ON public.authors USING btree (email);


--
-- TOC entry 4847 (class 1259 OID 140100)
-- Name: idx_authors_full_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_authors_full_name ON public.authors USING btree (full_name);


--
-- TOC entry 4866 (class 1259 OID 140103)
-- Name: idx_document_authors_author_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_authors_author_id ON public.document_authors USING btree (author_id);


--
-- TOC entry 4867 (class 1259 OID 140102)
-- Name: idx_document_authors_document_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_authors_document_id ON public.document_authors USING btree (document_id);


--
-- TOC entry 4874 (class 1259 OID 140104)
-- Name: idx_document_research_agenda_document_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_research_agenda_document_id ON public.document_research_agenda USING btree (document_id);


--
-- TOC entry 4875 (class 1259 OID 140105)
-- Name: idx_document_research_agenda_research_agenda_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_research_agenda_research_agenda_id ON public.document_research_agenda USING btree (research_agenda_id);


--
-- TOC entry 4905 (class 2606 OID 140078)
-- Name: credentials credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credentials
    ADD CONSTRAINT credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4898 (class 2606 OID 139793)
-- Name: document_authors document_authors_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_authors
    ADD CONSTRAINT document_authors_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.authors(id) ON DELETE CASCADE;


--
-- TOC entry 4899 (class 2606 OID 139788)
-- Name: document_authors document_authors_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_authors
    ADD CONSTRAINT document_authors_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4910 (class 2606 OID 139926)
-- Name: document_permissions document_permissions_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_permissions
    ADD CONSTRAINT document_permissions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4911 (class 2606 OID 140088)
-- Name: document_permissions document_permissions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_permissions
    ADD CONSTRAINT document_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(id);


--
-- TOC entry 4912 (class 2606 OID 139936)
-- Name: document_permissions document_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_permissions
    ADD CONSTRAINT document_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 4913 (class 2606 OID 140083)
-- Name: document_permissions document_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_permissions
    ADD CONSTRAINT document_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4900 (class 2606 OID 139812)
-- Name: document_research_agenda document_research_agenda_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_research_agenda
    ADD CONSTRAINT document_research_agenda_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4901 (class 2606 OID 139817)
-- Name: document_research_agenda document_research_agenda_research_agenda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_research_agenda
    ADD CONSTRAINT document_research_agenda_research_agenda_id_fkey FOREIGN KEY (research_agenda_id) REFERENCES public.research_agenda(id);


--
-- TOC entry 4896 (class 2606 OID 139773)
-- Name: documents documents_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- TOC entry 4897 (class 2606 OID 139778)
-- Name: documents documents_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- TOC entry 4902 (class 2606 OID 139833)
-- Name: files files_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4914 (class 2606 OID 140127)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4908 (class 2606 OID 139909)
-- Name: user_document_history user_document_history_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_document_history
    ADD CONSTRAINT user_document_history_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4909 (class 2606 OID 140073)
-- Name: user_document_history user_document_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_document_history
    ADD CONSTRAINT user_document_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4906 (class 2606 OID 139890)
-- Name: user_saved_documents user_saved_documents_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_saved_documents
    ADD CONSTRAINT user_saved_documents_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4907 (class 2606 OID 140068)
-- Name: user_saved_documents user_saved_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_saved_documents
    ADD CONSTRAINT user_saved_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4903 (class 2606 OID 139851)
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- TOC entry 4904 (class 2606 OID 139856)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


-- Completed on 2025-04-29 23:48:29

--
-- PostgreSQL database dump complete
--

