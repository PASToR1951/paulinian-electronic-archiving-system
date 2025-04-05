--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-04-04 09:35:41

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
-- TOC entry 238 (class 1255 OID 73793)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 223 (class 1259 OID 73765)
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    school_id character varying(50) NOT NULL,
    department_id integer
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 73764)
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO postgres;

--
-- TOC entry 5031 (class 0 OID 0)
-- Dependencies: 222
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- TOC entry 224 (class 1259 OID 73783)
-- Name: authors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.authors (
    author_id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(255) NOT NULL,
    affiliation character varying(255) NOT NULL,
    department character varying(255) NOT NULL,
    year_of_graduation integer,
    email character varying(255),
    linkedin character varying(255),
    orcid_id character varying(255),
    bio text,
    profile_picture character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.authors OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 73796)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    category_name character varying(100) NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 73795)
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
-- TOC entry 5032 (class 0 OID 0)
-- Dependencies: 225
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- TOC entry 219 (class 1259 OID 73738)
-- Name: credentials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.credentials (
    school_id character varying(50) NOT NULL,
    password text NOT NULL,
    role integer NOT NULL
);


ALTER TABLE public.credentials OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 73751)
-- Name: department; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.department (
    id integer NOT NULL,
    cbit boolean DEFAULT false,
    cons boolean DEFAULT false,
    casee boolean DEFAULT false,
    baed boolean DEFAULT false,
    faculty boolean DEFAULT false,
    staff boolean DEFAULT false,
    grad_school boolean DEFAULT false
);


ALTER TABLE public.department OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 73750)
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
-- TOC entry 5033 (class 0 OID 0)
-- Dependencies: 220
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.department.id;


--
-- TOC entry 237 (class 1259 OID 90180)
-- Name: document_topics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_topics (
    document_id integer NOT NULL,
    topic_id integer NOT NULL
);


ALTER TABLE public.document_topics OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 73810)
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    pages integer,
    publication_date date,
    file text,
    category_id integer,
    volume text,
    department character varying(255),
    abstract text,
    author_ids uuid[]
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 73809)
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
-- TOC entry 5034 (class 0 OID 0)
-- Dependencies: 227
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- TOC entry 218 (class 1259 OID 73730)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    role_name character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 73729)
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
-- TOC entry 5035 (class 0 OID 0)
-- Dependencies: 217
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 232 (class 1259 OID 73873)
-- Name: tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tokens (
    id integer NOT NULL,
    token text NOT NULL,
    user_id character varying(50),
    user_role character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tokens OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 73872)
-- Name: tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tokens_id_seq OWNER TO postgres;

--
-- TOC entry 5036 (class 0 OID 0)
-- Dependencies: 231
-- Name: tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tokens_id_seq OWNED BY public.tokens.id;


--
-- TOC entry 236 (class 1259 OID 90157)
-- Name: topics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.topics (
    id integer NOT NULL,
    topic_name text NOT NULL
);


ALTER TABLE public.topics OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 90156)
-- Name: topics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.topics_id_seq OWNER TO postgres;

--
-- TOC entry 5037 (class 0 OID 0)
-- Dependencies: 235
-- Name: topics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.topics_id_seq OWNED BY public.topics.id;


--
-- TOC entry 234 (class 1259 OID 73888)
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_permissions (
    id integer NOT NULL,
    role_id integer,
    document_id integer,
    can_read boolean DEFAULT false,
    can_write boolean DEFAULT false,
    can_edit boolean DEFAULT false,
    can_delete boolean DEFAULT false
);


ALTER TABLE public.user_permissions OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 73887)
-- Name: user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_permissions_id_seq OWNER TO postgres;

--
-- TOC entry 5038 (class 0 OID 0)
-- Dependencies: 233
-- Name: user_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_permissions_id_seq OWNED BY public.user_permissions.id;


--
-- TOC entry 230 (class 1259 OID 73839)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    school_id character varying(50) NOT NULL,
    department_id integer,
    saved_documents text[],
    history text[],
    first_name character varying(50),
    middle_name character varying(50),
    last_name character varying(50)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 73838)
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
-- TOC entry 5039 (class 0 OID 0)
-- Dependencies: 229
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4804 (class 2604 OID 73768)
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- TOC entry 4808 (class 2604 OID 73799)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 4796 (class 2604 OID 73754)
-- Name: department id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- TOC entry 4809 (class 2604 OID 81921)
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- TOC entry 4795 (class 2604 OID 73733)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 4811 (class 2604 OID 73876)
-- Name: tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens ALTER COLUMN id SET DEFAULT nextval('public.tokens_id_seq'::regclass);


--
-- TOC entry 4818 (class 2604 OID 90160)
-- Name: topics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics ALTER COLUMN id SET DEFAULT nextval('public.topics_id_seq'::regclass);


--
-- TOC entry 4813 (class 2604 OID 73891)
-- Name: user_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions ALTER COLUMN id SET DEFAULT nextval('public.user_permissions_id_seq'::regclass);


--
-- TOC entry 4810 (class 2604 OID 73842)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5011 (class 0 OID 73765)
-- Dependencies: 223
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, school_id, department_id) FROM stdin;
1	ADMIN-001	1
\.


--
-- TOC entry 5012 (class 0 OID 73783)
-- Dependencies: 224
-- Data for Name: authors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.authors (author_id, full_name, affiliation, department, year_of_graduation, email, linkedin, orcid_id, bio, profile_picture, created_at, updated_at) FROM stdin;
d4f1367c-7845-4d48-aafa-d159a609559f	Alice Johnson	Harvard University	Computer Science	2018	alice.johnson@email.com	https://linkedin.com/in/alicejohnson	0000-0001-2345-6789	Alice is a researcher in AI and Machine Learning.	/uploads/alice.jpg	2025-03-30 22:28:23.272887	2025-03-30 22:28:23.272887
9ac21f33-a527-45a8-9310-94d247f3fc86	Bob Smith	MIT	Physics	2020	bob.smith@email.com	https://linkedin.com/in/bobsmith	0000-0002-3456-7890	Bob specializes in quantum computing and theoretical physics.	/uploads/bob.jpg	2025-03-30 22:28:23.272887	2025-03-30 22:28:23.272887
dd53d3b0-6e95-46ed-bcca-b99d8a1f3781	Charlie Evans	Stanford University	Biotechnology	\N	\N	https://linkedin.com/in/charlieevans	\N	Charlie is focused on genetic engineering and CRISPR research.	/uploads/charlie.jpg	2025-03-30 22:28:23.272887	2025-03-30 22:28:23.272887
3dc1aa42-c73b-4a56-b397-8d8b404334cd	Diana Lopez	Oxford University	Philosophy	2015	diana.lopez@email.com	\N	0000-0003-4567-8901	Diana studies ethics in artificial intelligence.	\N	2025-03-30 22:28:23.272887	2025-03-30 22:28:23.272887
17e4d706-b4f2-4647-bac7-8d71a5774f68	Ethan Wright	Cambridge University	Mathematics	2019	ethan.wright@email.com	https://linkedin.com/in/ethanwright	\N	Ethan is passionate about topology and abstract algebra.	/uploads/ethan.jpg	2025-03-30 22:28:23.272887	2025-03-30 22:28:23.272887
\.


--
-- TOC entry 5014 (class 0 OID 73796)
-- Dependencies: 226
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, category_name) FROM stdin;
1	Thesis
2	Dissertation
4	Confluence
3	Synergy
\.


--
-- TOC entry 5007 (class 0 OID 73738)
-- Dependencies: 219
-- Data for Name: credentials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.credentials (school_id, password, role) FROM stdin;
ADMIN-001	adminpassword123	1
USER-001	userpassword123	2
USER-002	userpassword456	2
\.


--
-- TOC entry 5009 (class 0 OID 73751)
-- Dependencies: 221
-- Data for Name: department; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.department (id, cbit, cons, casee, baed, faculty, staff, grad_school) FROM stdin;
1	t	f	f	f	t	f	f
2	f	t	f	f	f	t	f
\.


--
-- TOC entry 5025 (class 0 OID 90180)
-- Dependencies: 237
-- Data for Name: document_topics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_topics (document_id, topic_id) FROM stdin;
\.


--
-- TOC entry 5016 (class 0 OID 73810)
-- Dependencies: 228
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, title, pages, publication_date, file, category_id, volume, department, abstract, author_ids) FROM stdin;
8	title 01	\N	2024-01-01	./filepathpdf/sample_upload.pdf	2	Volume-2	cbit	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	\N
9	dasdas	\N	2024-01-01	./filepathpdf/sample_upload.pdf	4	Volume-2	cbit	asdasdasd	\N
7	adasda	\N	2024-01-01	./filepathpdf/sample_upload.pdf	4	Volume-1	cbit	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	{dd53d3b0-6e95-46ed-bcca-b99d8a1f3781}
10	qweqweqwrq	\N	2024-01-01	./filepathpdf/sample_upload.pdf	3	none	cbit	asdadafasdadawewqeqeq	\N
11	trax	\N	2024-01-01	./filepathpdf/sample_upload.pdf	2	none	cbit	Abstracsadsdgerer	\N
12	trax	\N	2024-01-01	./filepathpdf/sample_upload.pdf	2	none	cbit	Abstracsadsdgerer	\N
13	artyui	\N	2024-01-01	./filepathpdf/sample_upload.pdf	4	none	cbit	asdadadad	\N
14	asdada	\N	2024-01-01	./filepathpdf/sample_upload.pdf	3	none	cbit	asdasdasd	\N
\.


--
-- TOC entry 5006 (class 0 OID 73730)
-- Dependencies: 218
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, role_name) FROM stdin;
1	Isadmin
2	Isregistered
\.


--
-- TOC entry 5020 (class 0 OID 73873)
-- Dependencies: 232
-- Data for Name: tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tokens (id, token, user_id, user_role, created_at) FROM stdin;
1	abc123	USER-001	Isregistered	2025-03-16 02:10:08.816254
2	xyz789	ADMIN-001	Isadmin	2025-03-16 02:10:08.816254
3	17ac2165-56d3-48b5-af34-44921dc285a3	ADMIN-001	Isadmin	2025-03-30 14:29:04
4	481e1295-b544-4bff-be8f-432392ee0466	ADMIN-001	Isadmin	2025-03-30 14:37:49.087
5	b9014565-f745-4689-8080-0d4f7c9811a8	ADMIN-001	Isadmin	2025-03-30 14:41:56.577
6	94f8641a-96c6-4200-9ae7-e0597924ccfb	ADMIN-001	Isadmin	2025-03-30 14:58:40.3
7	cd69ec0d-aabf-48cb-af48-9c0fee2913ca	ADMIN-001	Isadmin	2025-03-30 15:01:07.837
8	31b8d922-2887-442a-87ad-a88f3c655751	ADMIN-001	Isadmin	2025-03-30 15:02:47.971
9	ce588f92-8a25-45ee-a953-3281e50f4550	ADMIN-001	Isadmin	2025-03-30 15:06:01.525
10	4fab47bc-74a8-4915-97d0-bddb24e4e17e	ADMIN-001	Isadmin	2025-03-30 15:10:55.445
11	6c7936c8-b7da-4505-b8c8-7847aa70b9cb	ADMIN-001	Isadmin	2025-03-30 15:13:51.063
12	96c7f9d8-4a3a-4a94-8dac-1d198c48658f	ADMIN-001	Isadmin	2025-03-30 15:17:58.479
13	c102a956-d578-45e8-b75e-4bc8f75ceb2c	ADMIN-001	Isadmin	2025-03-30 15:26:03.997
14	7b8cff0f-25bc-47e5-8f4e-69a744610016	ADMIN-001	Isadmin	2025-03-30 15:35:01.409
15	3c233ba9-eef9-484b-82d8-922ae1429c8e	ADMIN-001	Isadmin	2025-03-30 15:40:32.357
16	ade64744-88f4-4f7f-b7be-ffa235c0b853	ADMIN-001	Isadmin	2025-03-30 15:44:59.315
17	d3d361d3-6af2-403a-b23b-5d3a17152a6d	ADMIN-001	Isadmin	2025-03-30 15:46:00.332
18	81712659-786b-4a23-a158-776d3ec06c0d	ADMIN-001	Isadmin	2025-03-30 15:50:47.484
19	5e125b3f-9fea-4b38-b714-b6f4c28cf9a7	ADMIN-001	Isadmin	2025-03-30 15:58:13.582
20	b31313cf-052d-41bb-808f-c4da26c0cf3a	ADMIN-001	Isadmin	2025-03-30 16:04:47.119
21	17c91323-6cc6-4abb-990e-63a1defc7c46	ADMIN-001	Isadmin	2025-03-30 16:08:43.664
22	5fa76b05-6dd7-4362-8962-4c152d7c5cc5	ADMIN-001	Isadmin	2025-03-30 16:12:58.177
23	aa2455d5-ee97-4795-87a5-813792bc5245	ADMIN-001	Isadmin	2025-03-30 16:16:30.796
24	700a284c-c065-4f7b-b78b-aa74e9966cbf	ADMIN-001	Isadmin	2025-03-30 16:28:09.916
25	d5d07da8-fb67-4d45-b8f3-75a31571f775	ADMIN-001	Isadmin	2025-03-30 16:38:35.515
26	baab558e-7c36-4a19-8ad5-47c607af9c6c	ADMIN-001	Isadmin	2025-03-30 16:46:48.991
27	3b640f81-cb26-4514-87e4-4862d911cf88	ADMIN-001	Isadmin	2025-03-30 16:50:33.478
28	93aeb01c-f4b1-4c2e-ae3b-e9ad2b82935c	ADMIN-001	Isadmin	2025-03-30 16:56:09.529
29	9cc17318-6523-411b-885b-da446bb60416	ADMIN-001	Isadmin	2025-03-30 16:58:38.145
30	dc497286-4f29-4a60-908c-927872fe3950	ADMIN-001	Isadmin	2025-03-30 17:01:20.28
31	7dc7c335-a8da-440c-a541-ea4f8c788d00	ADMIN-001	Isadmin	2025-03-30 17:07:53.401
32	a058092b-c47b-4025-89b0-82e7e1d01939	ADMIN-001	Isadmin	2025-03-31 01:16:05.952
33	a0c220f2-640c-4adf-aaaa-8a7e21f910cb	ADMIN-001	Isadmin	2025-03-31 02:07:16.19
34	a1f88e15-2032-496c-a413-7d5f0064d1d5	ADMIN-001	Isadmin	2025-03-31 02:09:31.31
35	2ef74f3b-c76f-4bcd-9987-08f06153f0d7	ADMIN-001	Isadmin	2025-03-31 02:10:49.661
36	9dfb1e67-5ebb-4f4b-86e3-10de50b7e6f8	ADMIN-001	Isadmin	2025-03-31 08:29:10.103
37	be21884c-7b7d-41de-8374-4f4d0f49d915	ADMIN-001	Isadmin	2025-03-31 08:33:16.449
38	31ddd3c6-8643-4542-8704-535904751bd2	ADMIN-001	Isadmin	2025-03-31 08:35:05.439
39	06d8f150-a4fb-4661-bd06-860454291a0c	ADMIN-001	Isadmin	2025-03-31 08:38:06.552
40	b5ca9578-63ca-448e-9676-3f24e181b371	ADMIN-001	Isadmin	2025-03-31 08:50:21.226
41	cfb02966-9ab3-4cb6-92c9-9c13220c4f57	ADMIN-001	Isadmin	2025-03-31 08:55:04.234
42	252e3b2e-fda2-49d8-854a-576a99db108e	ADMIN-001	Isadmin	2025-03-31 09:00:10.161
43	833d943a-3e3b-45eb-a304-cbc11bb1f90a	ADMIN-001	Isadmin	2025-03-31 09:00:51.617
44	e202aaf0-6001-44d4-af81-0b0d6a08bc79	ADMIN-001	Isadmin	2025-03-31 09:09:17.193
45	9a5be8d3-6a8b-4795-9dcc-9e9f663fe0a3	ADMIN-001	Isadmin	2025-03-31 09:10:39.725
46	f9b8ebf2-a3c4-4f18-870b-90f064dca818	ADMIN-001	Isadmin	2025-03-31 09:11:59.81
47	bc9d27c4-5019-4c97-85ba-962fa26c6e5a	ADMIN-001	Isadmin	2025-03-31 09:14:42.362
48	8227ba76-7eb5-49b9-9f4d-535eabb99dfe	ADMIN-001	Isadmin	2025-03-31 09:20:17.571
49	6060c848-5ea0-4a19-8f27-863f5d90a954	ADMIN-001	Isadmin	2025-03-31 09:23:29.059
50	72081b3e-d513-4996-95d7-caaace5f8e8e	ADMIN-001	Isadmin	2025-03-31 14:24:36.905
51	729aaa50-f884-48bd-b325-6b4c81616fb0	ADMIN-001	Isadmin	2025-03-31 14:33:48.402
52	b6eb6c59-352d-43cc-8d8e-e27b36c9903a	ADMIN-001	Isadmin	2025-03-31 14:39:37.715
53	25e9b917-a71e-40cd-9d5b-2507f42a5c53	ADMIN-001	Isadmin	2025-03-31 14:48:05.743
54	8310c27a-a8dc-4747-bb9a-9ef25e4fd37b	ADMIN-001	Isadmin	2025-03-31 14:54:22.738
55	265a8a79-33b7-4e21-90d7-05cc3620dfee	ADMIN-001	Isadmin	2025-03-31 15:05:40.905
56	020d8f5a-5007-43a8-b270-dc91192b70ec	ADMIN-001	Isadmin	2025-03-31 15:09:06.568
57	8ff53965-6d06-41f0-bf32-5b43cc39b0e2	ADMIN-001	Isadmin	2025-03-31 15:18:52.248
58	e5af2306-3b18-4566-9875-eece89f04aed	ADMIN-001	Isadmin	2025-03-31 15:22:41.984
59	387306d9-1b84-4935-b429-2cdd80e2ea76	ADMIN-001	Isadmin	2025-03-31 15:31:10.163
60	9452c634-d992-41e1-9935-ea0c08ace5e6	ADMIN-001	Isadmin	2025-03-31 15:34:57.041
61	b219c58f-2776-4dc9-866d-02530479724d	ADMIN-001	Isadmin	2025-03-31 15:38:25.149
62	6f5fa313-8092-48be-82f6-35c0eef6bb82	ADMIN-001	Isadmin	2025-03-31 15:40:56.481
63	6d865527-f49c-4b93-ad73-d9a3a16ef113	ADMIN-001	Isadmin	2025-03-31 15:44:25.098
64	e6221da9-2265-4e6b-bae6-a0102c30c67e	ADMIN-001	Isadmin	2025-03-31 15:47:44.378
65	81002119-529b-4346-a5b0-3ebdb01876de	ADMIN-001	Isadmin	2025-03-31 15:51:01.954
66	ffaacb87-6c99-4306-8d16-d0dbe47dae94	ADMIN-001	Isadmin	2025-03-31 15:53:23.612
67	476adfbb-f352-40b3-86be-f52c1e1d7392	ADMIN-001	Isadmin	2025-03-31 15:55:45.683
68	c6957e8f-0f09-44a8-b86b-f92b039a1fac	ADMIN-001	Isadmin	2025-03-31 16:03:16.195
69	eb256763-581c-4ba1-a7c5-d973abffe969	ADMIN-001	Isadmin	2025-03-31 16:05:48.523
70	9883742f-2b29-4487-9a9d-c7e516338e0a	ADMIN-001	Isadmin	2025-03-31 16:10:13.674
71	7cdb5152-f43c-4738-aa48-08e527824251	ADMIN-001	Isadmin	2025-03-31 22:58:17.693
72	6b1c5f8a-c49c-4efa-95cf-1098b164d48d	ADMIN-001	Isadmin	2025-03-31 23:05:19.61
73	bfcd526c-d910-41d8-a0fd-a4009b52a529	ADMIN-001	Isadmin	2025-03-31 23:07:42.296
74	aa1bbea5-2f8e-42a9-8b28-c8560568b5fa	ADMIN-001	Isadmin	2025-03-31 23:12:33.352
75	cd63ab4b-68c1-4016-82a0-305c827bfdd5	ADMIN-001	Isadmin	2025-03-31 23:20:07.711
76	9769aef4-6679-4faa-b6fc-ecee4d1ac518	ADMIN-001	Isadmin	2025-03-31 23:22:13.589
77	870f28c2-7c56-4681-a1c9-f6d2e65a32e7	ADMIN-001	Isadmin	2025-03-31 23:29:58.695
78	81598a04-4753-43c9-be09-75f0ddc94da3	ADMIN-001	Isadmin	2025-03-31 23:36:32.839
79	aaf50120-59f7-4acf-babb-a530309ffe07	ADMIN-001	Isadmin	2025-03-31 23:40:11.6
80	ae3650ba-a859-4f55-93fa-dc6eafa75d66	ADMIN-001	Isadmin	2025-04-01 00:58:36.339
81	ce07814e-66e4-4f95-864b-064c803863e6	ADMIN-001	Isadmin	2025-04-01 01:01:15.41
82	21dd6108-ef8f-441a-966a-2ca3aec84014	ADMIN-001	Isadmin	2025-04-01 01:05:44.173
83	40945ad6-728d-41bc-84bb-19fa32e3502b	ADMIN-001	Isadmin	2025-04-01 01:35:42.935
84	1fd6689a-463d-4b19-98a2-c56f328b22a7	ADMIN-001	Isadmin	2025-04-01 01:43:53.023
85	127b8c12-406f-4e6f-90da-d3d951c8c69d	ADMIN-001	Isadmin	2025-04-01 01:54:14.489
86	3128b294-482c-47f6-b0c5-9636bde3b62c	ADMIN-001	Isadmin	2025-04-01 01:59:14.937
87	088e3fce-da8c-48a2-83d6-a23c7c0cab12	ADMIN-001	Isadmin	2025-04-01 02:03:35.706
88	3624510c-91ae-4599-8dc4-6ac1ddff0c88	ADMIN-001	Isadmin	2025-04-01 02:07:53.121
89	e867a8f5-f803-46fe-a3cd-3f1f458703e1	ADMIN-001	Isadmin	2025-04-01 02:14:09.99
90	5064c4fe-1778-4ed5-89f4-3da4cf160ca3	ADMIN-001	Isadmin	2025-04-01 02:21:26.362
91	1d8f9445-631c-4178-8070-b0dc223d58eb	ADMIN-001	Isadmin	2025-04-01 02:23:39.443
92	40e4cadf-a9be-4a08-bad3-dee7c67c4f21	ADMIN-001	Isadmin	2025-04-01 02:35:56.219
93	f86c289e-989a-42dc-8578-08dc46febf31	ADMIN-001	Isadmin	2025-04-01 02:40:08.788
94	3ca1169f-e41a-4371-bdff-7882e4b0c97e	ADMIN-001	Isadmin	2025-04-01 02:42:56.723
95	d62b6f16-8b0f-48f4-9b33-3521b52a0feb	ADMIN-001	Isadmin	2025-04-01 02:48:20.732
96	0985f639-1efd-4af7-805b-4f43a2c76b32	ADMIN-001	Isadmin	2025-04-01 02:50:45.708
97	503b2a91-6e80-41f7-b1c7-894a85dfdb2a	ADMIN-001	Isadmin	2025-04-01 02:52:25.82
98	8b2253d8-565f-492e-b82e-8c7f8b602537	ADMIN-001	Isadmin	2025-04-01 03:17:59.894
99	23531ab5-2992-495b-bfce-d7702a2aea94	ADMIN-001	Isadmin	2025-04-01 03:24:17.424
100	05e11c07-38e6-46b3-a011-6afaf2903e41	ADMIN-001	Isadmin	2025-04-01 04:43:45.338
101	85178aa1-33ea-4694-849e-64fdd7382778	ADMIN-001	Isadmin	2025-04-01 05:01:18.366
102	8d6bc049-e1d0-4b16-a72b-51568f23e9fe	ADMIN-001	Isadmin	2025-04-01 05:05:19.239
103	a9d9d8b5-6fcd-49e2-ba65-5298f2fb17e6	ADMIN-001	Isadmin	2025-04-01 05:11:07.972
104	5c36b8f6-6e07-4436-8e32-6c230d618be6	ADMIN-001	Isadmin	2025-04-01 05:22:39.265
105	bdc95fd2-2c6e-476c-b867-7d2c5e88775b	ADMIN-001	Isadmin	2025-04-01 06:02:32.47
106	24a9f8f8-2b1d-44d9-bd95-f0272d68e338	ADMIN-001	Isadmin	2025-04-01 07:58:44.294
107	685a8ae6-95ab-436d-bd8d-83f866158021	ADMIN-001	Isadmin	2025-04-01 08:02:16.776
108	90425570-698a-41ca-8d9a-2b98514c41bf	ADMIN-001	Isadmin	2025-04-01 08:04:37.04
109	18f5accf-ad92-4a6d-a604-64df6b6a6c5c	ADMIN-001	Isadmin	2025-04-01 08:09:41.947
110	f882ef9a-14a7-4c15-b435-8001d9f34d2b	ADMIN-001	Isadmin	2025-04-01 08:15:43.457
111	3f64eabb-2e15-4274-bc29-266b2ca8491a	ADMIN-001	Isadmin	2025-04-01 08:19:54.326
112	7aafbf51-a4b6-4570-bd32-529a9ef4e290	ADMIN-001	Isadmin	2025-04-01 08:22:47.378
113	4acda6c3-7de9-409a-adff-ed7a181ecc1d	ADMIN-001	Isadmin	2025-04-01 08:34:04.836
114	c67b4e3b-69fc-467e-9a77-95e6ef830b9f	ADMIN-001	Isadmin	2025-04-01 08:37:19.532
115	85dbc21c-da20-4ffc-bf44-7f69824d5d09	ADMIN-001	Isadmin	2025-04-01 08:40:25.093
116	5d3da4ea-f20c-4a6b-8c1b-4c1577264d92	ADMIN-001	Isadmin	2025-04-01 08:42:44.358
117	d43b753c-c49f-491e-9f06-daa801613f52	ADMIN-001	Isadmin	2025-04-01 08:43:58.646
118	fa58e997-21fc-41ae-a043-aac792d89e1d	ADMIN-001	Isadmin	2025-04-01 08:45:34.469
119	6c47f1b0-956f-4b91-81f8-9f09705deeaf	ADMIN-001	Isadmin	2025-04-01 08:47:18.542
120	3aa2aa22-45a9-40a2-91b0-43af9e2ae49b	ADMIN-001	Isadmin	2025-04-01 08:47:52.424
121	23b07b64-63c5-4843-8153-15d52475e55b	ADMIN-001	Isadmin	2025-04-01 08:49:13.039
122	4369f847-5c16-44d2-9869-899f8fdc278e	ADMIN-001	Isadmin	2025-04-01 08:52:42.765
123	0f50df79-6493-4597-a87f-0375271b52b4	ADMIN-001	Isadmin	2025-04-01 08:53:25.054
124	40b57305-770a-4f4e-89c4-627e01b0c208	ADMIN-001	Isadmin	2025-04-01 08:55:49.838
126	94da0454-1ef8-4e6c-9d5c-8e4afe2ac6f3	ADMIN-001	Isadmin	2025-04-01 08:57:22.873
127	26883691-ec2a-49c4-97a3-7af83b9acc81	ADMIN-001	Isadmin	2025-04-01 09:10:50.609
128	ea19a9b1-33be-48a9-9bf5-1b96d02c0e99	ADMIN-001	Isadmin	2025-04-01 09:24:57.9
129	a59ce809-502a-420d-a8da-e8f83655ad4a	ADMIN-001	Isadmin	2025-04-01 09:34:08.989
131	71a3b56b-420e-4e6d-baeb-70aeef829c5d	ADMIN-001	Isadmin	2025-04-01 13:28:05.367
132	5c61055c-276e-4a60-a1ca-873bf64f4ec9	ADMIN-001	Isadmin	2025-04-01 13:31:14.929
133	b2a43f8c-6012-428b-97c1-f6bcd2444620	ADMIN-001	Isadmin	2025-04-01 13:38:05.43
134	15135e6c-95c4-41d4-a0af-20a082e03878	ADMIN-001	Isadmin	2025-04-01 13:41:19.975
135	2a3a0ae6-0dc7-4a28-9450-4f201763e9e6	ADMIN-001	Isadmin	2025-04-01 13:46:51.847
136	06cd6a21-3aa9-4414-bc0c-b9830dc8250a	ADMIN-001	Isadmin	2025-04-01 13:56:21.05
137	470abc8a-f38c-4a63-acb5-b8033cefb9d1	ADMIN-001	Isadmin	2025-04-01 13:59:56.08
138	8ec1424c-bfb5-4780-a88e-6392f9f92ea9	ADMIN-001	Isadmin	2025-04-01 14:02:18.29
139	7cb8a93c-5640-434f-907e-ddfbf82a09df	ADMIN-001	Isadmin	2025-04-01 14:06:34.114
140	b7f6c7e6-4b9f-4cfe-8886-6a8a85c3b193	ADMIN-001	Isadmin	2025-04-01 14:08:40.861
141	b87bf3c1-e6a6-4cda-a38a-949d7a224bfd	ADMIN-001	Isadmin	2025-04-01 14:14:45.276
142	e05e8854-73ad-4913-b153-b3a9840bd4e0	ADMIN-001	Isadmin	2025-04-01 14:17:52.747
143	559b4276-7e70-43ff-b174-e87a6aa050e5	ADMIN-001	Isadmin	2025-04-01 14:33:35.527
144	335f77b4-0579-4fc6-9698-cd709753a764	ADMIN-001	Isadmin	2025-04-01 15:18:17.902
145	4c6d2245-ecb8-4d02-82eb-5dffed5bd51d	ADMIN-001	Isadmin	2025-04-01 15:39:06.225
146	63081d9b-f003-428d-8cf3-054d195dac25	ADMIN-001	Isadmin	2025-04-01 15:45:09.12
147	fdba0bcc-5d34-4f1c-8f89-22a3c356394b	ADMIN-001	Isadmin	2025-04-01 16:06:55.459
148	ffd0ef19-23b9-4d85-a596-a86002397c5c	ADMIN-001	Isadmin	2025-04-01 16:58:05.619
149	347cfc19-1cb4-4b66-81fd-c9aff0526861	ADMIN-001	Isadmin	2025-04-03 22:08:07.764
150	29ec7a99-ff77-4aea-905f-ebd012b60ec5	ADMIN-001	Isadmin	2025-04-03 22:38:25.632
151	b0c04b1f-6ba7-4273-8514-653427a3d171	ADMIN-001	Isadmin	2025-04-03 22:42:52.096
152	9ac779ae-fde5-4fb2-89c9-1cea1389016c	ADMIN-001	Isadmin	2025-04-03 23:00:18.974
153	506c25d5-93af-4dfe-94e0-2718c0d65443	ADMIN-001	Isadmin	2025-04-03 23:01:58.151
154	43699f50-5b08-412e-9c7d-7991cd8f76c9	ADMIN-001	Isadmin	2025-04-03 23:03:49.054
155	996491ca-87d1-4002-8acd-55d996852ee0	ADMIN-001	Isadmin	2025-04-03 23:26:09.637
156	aa515296-1acf-4186-8d5a-a5fe4c48c4dc	ADMIN-001	Isadmin	2025-04-03 23:30:01.277
157	c2a98ca3-b742-4c5b-a99c-f420b14a1015	ADMIN-001	Isadmin	2025-04-04 00:17:58.81
\.


--
-- TOC entry 5024 (class 0 OID 90157)
-- Dependencies: 236
-- Data for Name: topics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.topics (id, topic_name) FROM stdin;
1	Science
\.


--
-- TOC entry 5022 (class 0 OID 73888)
-- Dependencies: 234
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_permissions (id, role_id, document_id, can_read, can_write, can_edit, can_delete) FROM stdin;
\.


--
-- TOC entry 5018 (class 0 OID 73839)
-- Dependencies: 230
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, school_id, department_id, saved_documents, history, first_name, middle_name, last_name) FROM stdin;
1	USER-001	1	{Doc1,Doc2}	{DocA}	John	Doe	Smith
2	USER-002	2	{Doc3}	{DocB,DocC}	Jane	Ann	Doe
3	ADMIN-001	1	{}	{}	Admin	User	One
\.


--
-- TOC entry 5040 (class 0 OID 0)
-- Dependencies: 222
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_id_seq', 1, true);


--
-- TOC entry 5041 (class 0 OID 0)
-- Dependencies: 225
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 1, false);


--
-- TOC entry 5042 (class 0 OID 0)
-- Dependencies: 220
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 1, false);


--
-- TOC entry 5043 (class 0 OID 0)
-- Dependencies: 227
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 14, true);


--
-- TOC entry 5044 (class 0 OID 0)
-- Dependencies: 217
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 1, false);


--
-- TOC entry 5045 (class 0 OID 0)
-- Dependencies: 231
-- Name: tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tokens_id_seq', 157, true);


--
-- TOC entry 5046 (class 0 OID 0)
-- Dependencies: 235
-- Name: topics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.topics_id_seq', 1, true);


--
-- TOC entry 5047 (class 0 OID 0)
-- Dependencies: 233
-- Name: user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_permissions_id_seq', 1, false);


--
-- TOC entry 5048 (class 0 OID 0)
-- Dependencies: 229
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- TOC entry 4828 (class 2606 OID 73770)
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- TOC entry 4830 (class 2606 OID 73772)
-- Name: admins admins_school_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_school_id_key UNIQUE (school_id);


--
-- TOC entry 4832 (class 2606 OID 73792)
-- Name: authors authors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.authors
    ADD CONSTRAINT authors_pkey PRIMARY KEY (author_id);


--
-- TOC entry 4834 (class 2606 OID 73801)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4824 (class 2606 OID 73744)
-- Name: credentials credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credentials
    ADD CONSTRAINT credentials_pkey PRIMARY KEY (school_id);


--
-- TOC entry 4826 (class 2606 OID 73763)
-- Name: department departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- TOC entry 4848 (class 2606 OID 90184)
-- Name: document_topics document_topics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_topics
    ADD CONSTRAINT document_topics_pkey PRIMARY KEY (document_id, topic_id);


--
-- TOC entry 4836 (class 2606 OID 73817)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 4820 (class 2606 OID 73735)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4822 (class 2606 OID 73737)
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 4842 (class 2606 OID 73881)
-- Name: tokens tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4846 (class 2606 OID 90164)
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (id);


--
-- TOC entry 4844 (class 2606 OID 73897)
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4838 (class 2606 OID 73846)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4840 (class 2606 OID 73848)
-- Name: users users_school_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_school_id_key UNIQUE (school_id);


--
-- TOC entry 4859 (class 2620 OID 73794)
-- Name: authors set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.authors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4850 (class 2606 OID 73778)
-- Name: admins admins_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.department(id) ON DELETE SET NULL;


--
-- TOC entry 4851 (class 2606 OID 73773)
-- Name: admins admins_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.credentials(school_id);


--
-- TOC entry 4849 (class 2606 OID 73745)
-- Name: credentials credentials_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credentials
    ADD CONSTRAINT credentials_role_fkey FOREIGN KEY (role) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 4857 (class 2606 OID 90185)
-- Name: document_topics document_topics_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_topics
    ADD CONSTRAINT document_topics_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4858 (class 2606 OID 90190)
-- Name: document_topics document_topics_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_topics
    ADD CONSTRAINT document_topics_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE CASCADE;


--
-- TOC entry 4852 (class 2606 OID 73818)
-- Name: documents documents_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- TOC entry 4854 (class 2606 OID 73882)
-- Name: tokens tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(school_id) ON DELETE CASCADE;


--
-- TOC entry 4855 (class 2606 OID 73903)
-- Name: user_permissions user_permissions_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4856 (class 2606 OID 73898)
-- Name: user_permissions user_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 4853 (class 2606 OID 73849)
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.department(id) ON DELETE SET NULL;


-- Completed on 2025-04-04 09:35:42

--
-- PostgreSQL database dump complete
--

