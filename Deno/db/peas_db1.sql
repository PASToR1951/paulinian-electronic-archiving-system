--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-04-24 13:21:30

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
-- TOC entry 241 (class 1255 OID 90196)
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
-- TOC entry 217 (class 1259 OID 90197)
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    school_id character varying(50) NOT NULL,
    department_id integer
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 90200)
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
-- TOC entry 5058 (class 0 OID 0)
-- Dependencies: 218
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- TOC entry 219 (class 1259 OID 90201)
-- Name: authors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.authors (
    author_id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(255) NOT NULL,
    affiliation character varying(255),
    department character varying(255),
    year_of_graduation integer,
    email character varying(255),
    linkedin character varying(255),
    orcid_id character varying(255),
    biography text,
    profile_picture character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    gender character varying(1),
    deleted_at timestamp without time zone,
    CONSTRAINT authors_gender_check CHECK (((gender)::text = ANY ((ARRAY['M'::character varying, 'F'::character varying])::text[])))
);


ALTER TABLE public.authors OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 90209)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    category_name character varying(100) NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 90212)
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
-- TOC entry 5059 (class 0 OID 0)
-- Dependencies: 221
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- TOC entry 222 (class 1259 OID 90213)
-- Name: credentials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.credentials (
    school_id character varying(50) NOT NULL,
    password text NOT NULL,
    role integer NOT NULL
);


ALTER TABLE public.credentials OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 90218)
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
-- TOC entry 224 (class 1259 OID 90228)
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
-- TOC entry 5060 (class 0 OID 0)
-- Dependencies: 224
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.department.id;


--
-- TOC entry 240 (class 1259 OID 114752)
-- Name: document_authors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_authors (
    document_id integer NOT NULL,
    author_id uuid NOT NULL
);


ALTER TABLE public.document_authors OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 90229)
-- Name: document_topics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_topics (
    document_id integer NOT NULL,
    topic_id integer NOT NULL
);


ALTER TABLE public.document_topics OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 90232)
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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 90237)
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
-- TOC entry 5061 (class 0 OID 0)
-- Dependencies: 227
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- TOC entry 228 (class 1259 OID 90238)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    role_name character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 90241)
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
-- TOC entry 5062 (class 0 OID 0)
-- Dependencies: 229
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 230 (class 1259 OID 90242)
-- Name: saved_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saved_documents (
    id integer NOT NULL,
    school_id character varying(50),
    document_id integer,
    date_saved timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.saved_documents OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 90246)
-- Name: saved_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.saved_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saved_documents_id_seq OWNER TO postgres;

--
-- TOC entry 5063 (class 0 OID 0)
-- Dependencies: 231
-- Name: saved_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.saved_documents_id_seq OWNED BY public.saved_documents.id;


--
-- TOC entry 232 (class 1259 OID 90247)
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
-- TOC entry 233 (class 1259 OID 90253)
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
-- TOC entry 5064 (class 0 OID 0)
-- Dependencies: 233
-- Name: tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tokens_id_seq OWNED BY public.tokens.id;


--
-- TOC entry 234 (class 1259 OID 90254)
-- Name: topics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.topics (
    id integer NOT NULL,
    topic_name character varying(100) NOT NULL
);


ALTER TABLE public.topics OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 90257)
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
-- TOC entry 5065 (class 0 OID 0)
-- Dependencies: 235
-- Name: topics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.topics_id_seq OWNED BY public.topics.id;


--
-- TOC entry 236 (class 1259 OID 90258)
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
-- TOC entry 237 (class 1259 OID 90265)
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
-- TOC entry 5066 (class 0 OID 0)
-- Dependencies: 237
-- Name: user_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_permissions_id_seq OWNED BY public.user_permissions.id;


--
-- TOC entry 238 (class 1259 OID 90266)
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
-- TOC entry 239 (class 1259 OID 90271)
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
-- TOC entry 5067 (class 0 OID 0)
-- Dependencies: 239
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4804 (class 2604 OID 90272)
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- TOC entry 4808 (class 2604 OID 90273)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 4809 (class 2604 OID 90274)
-- Name: department id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- TOC entry 4817 (class 2604 OID 90275)
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- TOC entry 4820 (class 2604 OID 90276)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 4821 (class 2604 OID 90277)
-- Name: saved_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_documents ALTER COLUMN id SET DEFAULT nextval('public.saved_documents_id_seq'::regclass);


--
-- TOC entry 4823 (class 2604 OID 90278)
-- Name: tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens ALTER COLUMN id SET DEFAULT nextval('public.tokens_id_seq'::regclass);


--
-- TOC entry 4825 (class 2604 OID 90279)
-- Name: topics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics ALTER COLUMN id SET DEFAULT nextval('public.topics_id_seq'::regclass);


--
-- TOC entry 4826 (class 2604 OID 90280)
-- Name: user_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions ALTER COLUMN id SET DEFAULT nextval('public.user_permissions_id_seq'::regclass);


--
-- TOC entry 4831 (class 2604 OID 90281)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5029 (class 0 OID 90197)
-- Dependencies: 217
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, school_id, department_id) FROM stdin;
1	ADMIN-001	1
\.


--
-- TOC entry 5031 (class 0 OID 90201)
-- Dependencies: 219
-- Data for Name: authors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.authors (author_id, full_name, affiliation, department, year_of_graduation, email, linkedin, orcid_id, biography, profile_picture, created_at, updated_at, gender, deleted_at) FROM stdin;
9ac21f33-a527-45a8-9310-94d247f3fc86	Bob Smith	\N	Physics	\N	bob.smith@email.com	\N	\N	hello kitty?	\N	2025-03-30 22:28:23.272887	2025-04-10 19:50:15.791837	M	\N
3dc1aa42-c73b-4a56-b397-8d8b404334cd	Diana Lopez	\N	Philosophy	\N	diana.lopez@email.com	\N	\N	alege	\N	2025-03-30 22:28:23.272887	2025-04-10 19:51:33.881277	M	\N
dd53d3b0-6e95-46ed-bcca-b99d8a1f3781	Charlie Evans	St. Paul University Manila	Biotechnology	\N	CharlieEvans@marvels.com	https://linkedin.com/in/charlieevans	\N	ngano?\n	\N	2025-03-30 22:28:23.272887	2025-04-11 00:42:55.544405	M	\N
1d8fcd13-b2c6-479f-aa17-ae2ee1ab7960	alice johnson d	SPUP	Computer Science	\N	\N	\N	\N	\N	\N	2025-04-16 00:38:16.038869	2025-04-16 00:38:16.038869	\N	\N
d4f1367c-7845-4d48-aafa-d159a609559f	Alice Johnson	Harvard University	College of Nursing	\N	alice.johnson@email.com	https://linkedin.com/in/alicejohnson	\N	heasd	\N	2025-03-30 22:28:23.272887	2025-04-20 15:12:31.750564	M	\N
a32ad744-f69b-4bd9-a32a-858c9543fc9c	alice ko	SPUP	Computer Science	\N	\N	\N	\N	\N	\N	2025-04-20 15:19:00.206273	2025-04-20 15:19:00.206273	\N	\N
d5d15f17-7829-471f-b6e6-0a3330ce09d1	cj	\N	\N	\N	\N	\N	\N	\N	\N	2025-04-20 15:14:31.849831	2025-04-21 00:55:21.363078	\N	\N
7ace48e2-a77a-428e-8bcf-83313b76da46	James Smith	SPUP	Computer Science	\N	\N	\N	\N	\N	\N	2025-04-22 10:28:13.47546	2025-04-22 10:28:13.47546	\N	\N
\.


--
-- TOC entry 5032 (class 0 OID 90209)
-- Dependencies: 220
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, category_name) FROM stdin;
1	Thesis
2	Dissertation
4	Confluence
3	Synergy
\.


--
-- TOC entry 5034 (class 0 OID 90213)
-- Dependencies: 222
-- Data for Name: credentials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.credentials (school_id, password, role) FROM stdin;
ADMIN-001	adminpassword123	1
USER-001	userpassword123	2
USER-002	userpassword456	2
\.


--
-- TOC entry 5035 (class 0 OID 90218)
-- Dependencies: 223
-- Data for Name: department; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.department (id, cbit, cons, casee, baed, faculty, staff, grad_school) FROM stdin;
1	t	f	f	f	t	f	f
2	f	t	f	f	f	t	f
\.


--
-- TOC entry 5052 (class 0 OID 114752)
-- Dependencies: 240
-- Data for Name: document_authors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_authors (document_id, author_id) FROM stdin;
85	d5d15f17-7829-471f-b6e6-0a3330ce09d1
86	a32ad744-f69b-4bd9-a32a-858c9543fc9c
87	d4f1367c-7845-4d48-aafa-d159a609559f
90	1d8fcd13-b2c6-479f-aa17-ae2ee1ab7960
91	1d8fcd13-b2c6-479f-aa17-ae2ee1ab7960
92	7ace48e2-a77a-428e-8bcf-83313b76da46
\.


--
-- TOC entry 5037 (class 0 OID 90229)
-- Dependencies: 225
-- Data for Name: document_topics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_topics (document_id, topic_id) FROM stdin;
85	1
85	40
86	22
87	69
90	1
90	22
91	1
91	22
92	22
\.


--
-- TOC entry 5038 (class 0 OID 90232)
-- Dependencies: 226
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, title, pages, publication_date, file, category_id, volume, department, abstract, updated_at, created_at) FROM stdin;
90	i love her	\N	2025-04-01	./filepathpdf/ED591309.pdf	3	1	Computer Science	<div class="abstract-text"><p>This quantitative study uses a survey to determine how public school teachers perceive the efficacy of the intervention of the Dignity For All Student’s Act on the climate of civility in the classroom at one specific public middle school located in Upstate New York.</p><p>The intent is to explore the perceived efficacy of the intervention put into place in 2012 to address cyberharassment and to cultivate civility in the classroom.</p><p>A total of 47 teachers participated in this study.</p><p>This study provides background on the prevalence of cyberharassment in schools.</p><p>The results show that the cyberharassment behaviors of sexting, stalking, bullying, spreading rumors, and sending embarassing pictures have occurred with some frequency over the 2017-2018 school year.</p><p>Sexting was the most witnessed by teachers (38.3 percent) with 36.2 percent indicating a frequency of once a year.</p><p>The sending of pictures to embarrass was observed by 23.4 percent of the teachers, 12.8 percent observed the frequency of once a month.</p><p>The spreading sexual rumors was observed by 34.0 percent of the teachers with a frequency of 27.7 percent stating it occurs once a week.</p><p>The findings further suggest an inconsistency among teachers in addressing online behavior with their students.</p><p>Some teachers (38 percent) indicated they discuss appropriate online behavior with their students “as needed,” while 29 percent indicate they never do.</p><p>Additionally, 55.3 percent view the Dignity For All Students Act as having an average effect on cultivating civility as a part of the school’s culture.</p><p>Additionally, 78.7 percent of the respondents believe DASA has had little impact on cyberharassment incidents.</p></div>	2025-04-22 02:35:23.841422	2025-04-22 02:35:23.841422
91	i love her	\N	2025-04-01	./filepathpdf/ED591309.pdf	3	2	Computer Science	<div class="abstract-text"><p>This quantitative study uses a survey to determine how public school teachers perceive the efficacy of the intervention of the Dignity For All Student’s Act on the climate of civility in the classroom at one specific public middle school located in Upstate New York.</p><p>The intent is to explore the perceived efficacy of the intervention put into place in 2012 to address cyberharassment and to cultivate civility in the classroom.</p><p>A total of 47 teachers participated in this study.</p><p>This study provides background on the prevalence of cyberharassment in schools.</p><p>The results show that the cyberharassment behaviors of sexting, stalking, bullying, spreading rumors, and sending embarassing pictures have occurred with some frequency over the 2017-2018 school year.</p><p>Sexting was the most witnessed by teachers (38.3 percent) with 36.2 percent indicating a frequency of once a year.</p><p>The sending of pictures to embarrass was observed by 23.4 percent of the teachers, 12.8 percent observed the frequency of once a month.</p><p>The spreading sexual rumors was observed by 34.0 percent of the teachers with a frequency of 27.7 percent stating it occurs once a week.</p><p>The findings further suggest an inconsistency among teachers in addressing online behavior with their students.</p><p>Some teachers (38 percent) indicated they discuss appropriate online behavior with their students “as needed,” while 29 percent indicate they never do.</p><p>Additionally, 55.3 percent view the Dignity For All Students Act as having an average effect on cultivating civility as a part of the school’s culture.</p><p>Additionally, 78.7 percent of the respondents believe DASA has had little impact on cyberharassment incidents.</p></div>	2025-04-22 02:35:30.055927	2025-04-22 02:35:30.055927
85	test	\N	2025-03-06	./filepathpdf/ED591309.pdf	4	1	Computer Science	<div class="abstract-text"><p>This quantitative study uses a survey to determine how public school teachers perceive the efficacy of the intervention of the Dignity For All Student’s Act on the climate of civility in the classroom at one specific public middle school located in Upstate New York.</p><p>The intent is to explore the perceived efficacy of the intervention put into place in 2012 to address cyberharassment and to cultivate civility in the classroom.</p><p>A total of 47 teachers participated in this study.</p><p>This study provides background on the prevalence of cyberharassment in schools.</p><p>The results show that the cyberharassment behaviors of sexting, stalking, bullying, spreading rumors, and sending embarassing pictures have occurred with some frequency over the 2017-2018 school year.</p><p>Sexting was the most witnessed by teachers (38.3 percent) with 36.2 percent indicating a frequency of once a year.</p><p>The sending of pictures to embarrass was observed by 23.4 percent of the teachers, 12.8 percent observed the frequency of once a month.</p><p>The spreading sexual rumors was observed by 34.0 percent of the teachers with a frequency of 27.7 percent stating it occurs once a week.</p><p>The findings further suggest an inconsistency among teachers in addressing online behavior with their students.</p><p>Some teachers (38 percent) indicated they discuss appropriate online behavior with their students “as needed,” while 29 percent indicate they never do.</p><p>Additionally, 55.3 percent view the Dignity For All Students Act as having an average effect on cultivating civility as a part of the school’s culture.</p><p>Additionally, 78.7 percent of the respondents believe DASA has had little impact on cyberharassment incidents.</p></div>	2025-04-20 15:18:08.318463	2025-04-20 16:35:43.7254
92	A SAMPLE RESEARCH PAPER/THESIS/DISSERTATION ON ASPECTS OF ELEMENTARY LINEARY ALGEBRA	\N	2025-04-01	./filepathpdf/thesis.pdf	1	1	Computer Science	<div class="abstract-text"><p>OF THE DISSERTATION OF NAME OF STUDENT, for the Doctor of Philosophy degree in MAJOR FIELD, presented on DATE OF DEFENSE, at Southern Illinois University Car- bondale. (Do not use abbreviations.) TITLE: A SAMPLE RESEARCH PAPER ON ASPECTS OF ELEMENTARY LINEAR ALGEBRA MAJOR PROFESSOR: Dr.</p><p>J.</p><p>Jones (Begin the abstract here, typewritten and double-spaced.</p><p>A thesis abstract should consist of 350 words or less including the heading.</p><p>A page and one-half is approximately 350 words.) iii</p></div>	2025-04-22 10:28:13.47546	2025-04-22 10:28:13.47546
86	sample 01	\N	2025-03-01	./filepathpdf/ED591309.pdf	1	1	Computer Science	<div class="abstract-text"><p>This quantitative study uses a survey to determine how public school teachers perceive the efficacy of the intervention of the Dignity For All Student’s Act on the climate of civility in the classroom at one specific public middle school located in Upstate New York.</p><p>The intent is to explore the perceived efficacy of the intervention put into place in 2012 to address cyberharassment and to cultivate civility in the classroom.</p><p>A total of 47 teachers participated in this study.</p><p>This study provides background on the prevalence of cyberharassment in schools.</p><p>The results show that the cyberharassment behaviors of sexting, stalking, bullying, spreading rumors, and sending embarassing pictures have occurred with some frequency over the 2017-2018 school year.</p><p>Sexting was the most witnessed by teachers (38.3 percent) with 36.2 percent indicating a frequency of once a year.</p><p>The sending of pictures to embarrass was observed by 23.4 percent of the teachers, 12.8 percent observed the frequency of once a month.</p><p>The spreading sexual rumors was observed by 34.0 percent of the teachers with a frequency of 27.7 percent stating it occurs once a week.</p><p>The findings further suggest an inconsistency among teachers in addressing online behavior with their students.</p><p>Some teachers (38 percent) indicated they discuss appropriate online behavior with their students “as needed,” while 29 percent indicate they never do.</p><p>Additionally, 55.3 percent view the Dignity For All Students Act as having an average effect on cultivating civility as a part of the school’s culture.</p><p>Additionally, 78.7 percent of the respondents believe DASA has had little impact on cyberharassment incidents.</p></div>	2025-04-20 15:53:23.468646	2025-04-20 16:35:43.7254
87	sample 022	\N	2025-03-30	./filepathpdf/ED591309.pdf	1	1	Computer Science	<div class="abstract-text"><p>This quantitative study uses a survey to determine how public school teachers perceive the efficacy of the intervention of the Dignity For All Student’s Act on the climate of civility in the classroom at one specific public middle school located in Upstate New York.</p><p>The intent is to explore the perceived efficacy of the intervention put into place in 2012 to address cyberharassment and to cultivate civility in the classroom.</p><p>A total of 47 teachers participated in this study.</p><p>This study provides background on the prevalence of cyberharassment in schools.</p><p>The results show that the cyberharassment behaviors of sexting, stalking, bullying, spreading rumors, and sending embarassing pictures have occurred with some frequency over the 2017-2018 school year.</p><p>Sexting was the most witnessed by teachers (38.3 percent) with 36.2 percent indicating a frequency of once a year.</p><p>The sending of pictures to embarrass was observed by 23.4 percent of the teachers, 12.8 percent observed the frequency of once a month.</p><p>The spreading sexual rumors was observed by 34.0 percent of the teachers with a frequency of 27.7 percent stating it occurs once a week.</p><p>The findings further suggest an inconsistency among teachers in addressing online behavior with their students.</p><p>Some teachers (38 percent) indicated they discuss appropriate online behavior with their students “as needed,” while 29 percent indicate they never do.</p><p>Additionally, 55.3 percent view the Dignity For All Students Act as having an average effect on cultivating civility as a part of the school’s culture.</p><p>Additionally, 78.7 percent of the respondents believe DASA has had little impact on cyberharassment incidents.</p></div>	2025-04-20 16:17:53.627105	2025-04-20 16:35:43.7254
\.


--
-- TOC entry 5040 (class 0 OID 90238)
-- Dependencies: 228
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, role_name) FROM stdin;
1	Isadmin
2	Isregistered
\.


--
-- TOC entry 5042 (class 0 OID 90242)
-- Dependencies: 230
-- Data for Name: saved_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.saved_documents (id, school_id, document_id, date_saved) FROM stdin;
\.


--
-- TOC entry 5044 (class 0 OID 90247)
-- Dependencies: 232
-- Data for Name: tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tokens (id, token, user_id, user_role, created_at) FROM stdin;
4	75e6c9f1-8548-48fa-ba2d-5fb76bbb27ae	ADMIN-001	Isadmin	2025-04-05 17:48:54.962
5	d315a695-dd76-431d-b5f7-b82ae3284477	ADMIN-001	Isadmin	2025-04-05 18:03:49.963
6	cbf79248-5103-4519-b89c-aa6714ba56ae	ADMIN-001	Isadmin	2025-04-06 14:48:56.079
7	740ad0f1-4f58-4c1c-834b-8c002ddb0cbe	ADMIN-001	Isadmin	2025-04-06 15:46:11.144
8	1f4c4e30-d633-4dd4-8a96-2462f5357ccf	ADMIN-001	Isadmin	2025-04-06 15:47:07.64
9	20dfa654-92bc-4fcd-a240-83d73dcdaf03	ADMIN-001	Isadmin	2025-04-06 15:51:49.233
10	52a68097-a7fe-4e71-9ddd-28bd27ad862c	ADMIN-001	Isadmin	2025-04-06 15:53:39.775
11	fccd9122-5324-4615-a2c4-03a1db3fa8e7	ADMIN-001	Isadmin	2025-04-06 15:56:28.729
12	dbbf5c8f-0f66-4e98-a80d-c85e2e03bd15	ADMIN-001	Isadmin	2025-04-06 15:59:33.145
13	10e2752e-e404-4bf5-a13b-d1d426416dbf	ADMIN-001	Isadmin	2025-04-06 16:03:55.848
14	aa28d756-044a-4ff1-a406-3c7061fa95a1	ADMIN-001	Isadmin	2025-04-06 18:27:20.989
15	fff7e81c-c90a-4611-8e6f-b2218fdce141	ADMIN-001	Isadmin	2025-04-06 18:40:02.659
16	b562a326-4134-43aa-bba5-2f944d8d6a2e	ADMIN-001	Isadmin	2025-04-06 18:46:11.517
17	e08e4bf3-2350-45a8-b858-a0cdada5f9a3	ADMIN-001	Isadmin	2025-04-06 19:05:36.938
18	10024974-50e2-469f-bb8e-abe95dd1755e	ADMIN-001	Isadmin	2025-04-08 02:25:17.647
19	65e1da96-2bde-4c76-b210-0b0303bf4c83	ADMIN-001	Isadmin	2025-04-08 02:42:58.164
20	671efd40-9905-4788-8cf1-9a62df95dc55	ADMIN-001	Isadmin	2025-04-08 02:49:29.246
21	083c9cc3-b6dd-41d1-a2a4-54514d09d279	ADMIN-001	Isadmin	2025-04-08 02:57:57.213
22	ba179584-2d80-4fc5-ac5f-503dd15dc047	ADMIN-001	Isadmin	2025-04-08 02:59:50.846
23	5b785d89-12c3-4feb-9d29-5f007cafc2c5	ADMIN-001	Isadmin	2025-04-08 03:02:28.622
24	84deeb72-d8be-4ddc-93b6-15c45b5bb79b	ADMIN-001	Isadmin	2025-04-08 03:11:54.286
25	4f818154-1bd0-4c1b-bf85-b6df1cc63c03	ADMIN-001	Isadmin	2025-04-08 03:43:16.411
26	c0fc692a-31e4-4c1c-af1f-3c153b2d1a75	ADMIN-001	Isadmin	2025-04-08 05:14:57.421
27	4acd04b1-1fd9-4b71-8058-b7b165579c1c	ADMIN-001	Isadmin	2025-04-08 05:42:17.101
32	b5a2b1aa-97e8-456a-8d5a-fb2648f9eafd	ADMIN-001	Isadmin	2025-04-08 10:50:06.848
33	e1199c51-cc0b-4580-8f9a-1f286cdf7a5e	ADMIN-001	Isadmin	2025-04-08 10:59:21.636
34	8b375c93-f6a8-4141-87dd-6fc5b59b44ac	ADMIN-001	Isadmin	2025-04-08 11:58:55.35
35	8cb0ba8b-c479-4837-9c2e-d376da926e54	ADMIN-001	Isadmin	2025-04-08 13:21:43.188
36	ac608578-efa4-49a2-81d3-0e375a60d336	ADMIN-001	Isadmin	2025-04-08 14:01:08.794
37	d1c6c00e-c04f-4eb4-a607-12fc9498b18d	ADMIN-001	Isadmin	2025-04-08 14:48:51.309
38	4419a150-b7e4-49c1-9de5-557c83a1b082	ADMIN-001	Isadmin	2025-04-08 14:57:26.25
39	1874c529-478f-40b8-89dc-c0e04f145051	ADMIN-001	Isadmin	2025-04-08 15:09:29.351
40	5bc77726-a8d8-426f-981f-8f8d1a0cd63a	ADMIN-001	Isadmin	2025-04-08 15:39:42.675
41	5966cab4-515b-4be2-a64f-f210ee185ca3	ADMIN-001	Isadmin	2025-04-08 17:58:02.329
42	cfe95612-25ae-40af-a7e4-44c36eeb5739	ADMIN-001	Isadmin	2025-04-08 18:08:17.577
43	ba3051a2-d43e-4f1a-91d7-1620e4ae3d21	ADMIN-001	Isadmin	2025-04-08 18:13:12.338
44	6d71d52a-4ad0-4faa-9abc-d13bd5881636	ADMIN-001	Isadmin	2025-04-08 18:17:46.443
77	18f51c2a-b389-4e75-9059-8e789b8dddeb	ADMIN-001	Isadmin	2025-04-09 11:19:59.654
78	9b9d3dc5-cecf-41fd-82dc-ec19431e27a1	ADMIN-001	Isadmin	2025-04-09 16:12:34.089
79	61f1ee3d-092c-454c-b471-1b575ee99857	ADMIN-001	Isadmin	2025-04-09 16:32:41.203
80	5264f82e-3d2d-44e9-a369-08346be82e36	ADMIN-001	Isadmin	2025-04-09 16:55:31.981
81	008b7926-2168-4ecb-93a9-b5ce992278da	ADMIN-001	Isadmin	2025-04-09 17:11:46.725
82	bb5e194c-9392-4cbb-ad7e-50cef4739960	ADMIN-001	Isadmin	2025-04-10 02:59:29.31
83	7836099c-c5cf-427c-98f3-e08e0792e8e5	ADMIN-001	Isadmin	2025-04-10 07:13:37.592
84	ef67b15a-5331-46cd-8a38-e75766428c87	ADMIN-001	Isadmin	2025-04-10 07:32:57.216
85	76c5e8f2-ad3d-416d-af3d-80bf11ce81ee	ADMIN-001	Isadmin	2025-04-10 07:36:13.119
86	1b9a6b12-1a48-4d01-a510-3f8ed4478c17	ADMIN-001	Isadmin	2025-04-10 07:51:37.904
87	e253ee44-2d81-410d-9cda-685d2ac186ca	ADMIN-001	Isadmin	2025-04-10 08:09:30.307
88	24ff5ebd-e1c8-4c47-ba37-f02860427186	ADMIN-001	Isadmin	2025-04-10 08:12:31.738
89	bae74e12-0e3a-4175-afc0-81ab630cac9a	ADMIN-001	Isadmin	2025-04-10 08:16:50.77
90	a9b56ac9-ea41-4e4a-80bc-9ed82db2a8b8	ADMIN-001	Isadmin	2025-04-10 08:20:23.052
91	89755d3d-d3ca-4c5d-9190-949ffcfd8b69	ADMIN-001	Isadmin	2025-04-10 10:41:22.741
92	e832bbb8-e588-4e35-a1af-71a2d26076b9	ADMIN-001	Isadmin	2025-04-10 11:03:15.886
94	986a0757-37eb-4812-99f2-fbcd91ef5a35	ADMIN-001	Isadmin	2025-04-14 15:47:22.864
95	3bb1c9be-35d1-4a07-93a1-a2f259020b4c	ADMIN-001	Isadmin	2025-04-14 16:03:26.222
96	3ba0b331-6898-47bc-a079-401802edd153	ADMIN-001	Isadmin	2025-04-14 16:04:41.552
97	5189b5cf-ef80-49d6-9dae-826f75ec8a14	ADMIN-001	Isadmin	2025-04-14 16:06:39.943
98	6017c80b-a8cb-4663-9769-a7d0ffa5727f	ADMIN-001	Isadmin	2025-04-14 16:12:29.641
100	3d1fa48a-f1d8-4803-aeda-1c464891ad4b	ADMIN-001	Isadmin	2025-04-14 16:27:33.899
102	f8433bef-ded3-4cb2-a0e7-dbc74ded8a63	ADMIN-001	Isadmin	2025-04-14 16:31:34.453
103	61872654-1d3f-45a5-a01b-9009f48cba06	ADMIN-001	Isadmin	2025-04-14 16:45:18.112
104	712c73c3-254a-41b5-82cb-4002a3a17030	ADMIN-001	Isadmin	2025-04-14 16:49:16.195
105	0619e09c-3c76-4aae-8142-b2dd98196d28	ADMIN-001	Isadmin	2025-04-15 08:37:21.003
106	a251467d-bed2-44a5-9076-afc405db0926	ADMIN-001	Isadmin	2025-04-15 08:53:27.136
107	c5d36ddb-d055-44bc-9593-ca53dbaefb2e	ADMIN-001	Isadmin	2025-04-15 09:36:25.439
108	1f6f5fb2-bdcf-4f57-a2a6-11d9034c33f5	ADMIN-001	Isadmin	2025-04-15 16:18:29.406
110	987d7a6d-749e-4df7-94f7-fed956232fa1	ADMIN-001	Isadmin	2025-04-15 16:53:34.504
111	3d3a0980-cf66-4da6-b3ef-1b90412268c4	ADMIN-001	Isadmin	2025-04-15 16:58:28.87
112	1622f45c-ec01-4d95-adf9-8bc02fc2edb1	ADMIN-001	Isadmin	2025-04-15 17:01:36.615
113	fce9dc9b-c89d-4b2d-8a86-2316ae9e4f8e	ADMIN-001	Isadmin	2025-04-15 17:07:00.936
114	51bd05ba-c733-4d49-b83c-9686edea0ec7	ADMIN-001	Isadmin	2025-04-15 17:08:20.573
115	d0bdd5b1-3483-455b-8695-fd0686ba4ce0	ADMIN-001	Isadmin	2025-04-16 12:52:23.838
116	934e276e-6cb2-4a47-9cc5-508169550e2d	ADMIN-001	Isadmin	2025-04-16 18:46:09.469
117	1c6728bd-18f8-4337-8655-7bc6e409f614	ADMIN-001	Isadmin	2025-04-17 16:01:54.034
118	4fb68591-ef42-41c8-8dbf-0d891b69b1d4	ADMIN-001	Isadmin	2025-04-18 18:25:13.792
119	418659ee-a7d1-4919-a2d2-868be1acbca5	ADMIN-001	Isadmin	2025-04-18 19:05:45.829
120	b3c3f65a-c20b-4602-bd0b-51c8a4c54d5c	ADMIN-001	Isadmin	2025-04-19 14:50:23.239
121	57bf06ba-4435-4496-a3d3-b7082fc56df2	ADMIN-001	Isadmin	2025-04-19 20:13:17.334
122	36b3e471-502b-4caa-8c50-fbcad5a5b761	ADMIN-001	Isadmin	2025-04-20 06:15:54.81
123	9b270c66-a79e-4617-98b4-22edb4c457bf	ADMIN-001	Isadmin	2025-04-20 16:55:49.818
124	eb9940ed-bfba-4ad3-bdda-80e2f767cb4b	ADMIN-001	Isadmin	2025-04-21 16:24:17.211
125	93d25286-1e84-4fd9-a52b-fe039e65906e	ADMIN-001	Isadmin	2025-04-21 18:13:42.263
126	87f8fada-e7c2-44f6-9240-653d9c0f74e7	ADMIN-001	Isadmin	2025-04-21 18:22:45.526
127	b230cfa0-cc1b-424f-9776-eb807c0a1736	ADMIN-001	Isadmin	2025-04-22 02:27:40.824
128	895c21cc-f64e-40ce-9dcc-5a53bd3b559b	ADMIN-001	Isadmin	2025-04-22 13:34:21.374
129	d2a70436-8fdc-4d6c-8c86-e42632687caa	ADMIN-001	Isadmin	2025-04-23 08:30:58.23
130	dc776e2e-26b0-42a2-8fe6-cc08936a038b	ADMIN-001	Isadmin	2025-04-24 02:05:09.351
\.


--
-- TOC entry 5046 (class 0 OID 90254)
-- Dependencies: 234
-- Data for Name: topics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.topics (id, topic_name) FROM stdin;
1	Artificial Intelligence
2	Quantum Computing
22	education
32	technology
33	Science
40	Alice
68	MATH
69	Arts
70	artificial dicks
\.


--
-- TOC entry 5048 (class 0 OID 90258)
-- Dependencies: 236
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_permissions (id, role_id, document_id, can_read, can_write, can_edit, can_delete) FROM stdin;
\.


--
-- TOC entry 5050 (class 0 OID 90266)
-- Dependencies: 238
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, school_id, department_id, saved_documents, history, first_name, middle_name, last_name) FROM stdin;
1	USER-001	1	{Doc1,Doc2}	{DocA}	John	Doe	Smith
2	USER-002	2	{Doc3}	{DocB,DocC}	Jane	Ann	Doe
3	ADMIN-001	1	{}	{}	Admin	User	One
\.


--
-- TOC entry 5068 (class 0 OID 0)
-- Dependencies: 218
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_id_seq', 1, true);


--
-- TOC entry 5069 (class 0 OID 0)
-- Dependencies: 221
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 1, false);


--
-- TOC entry 5070 (class 0 OID 0)
-- Dependencies: 224
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 1, false);


--
-- TOC entry 5071 (class 0 OID 0)
-- Dependencies: 227
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 92, true);


--
-- TOC entry 5072 (class 0 OID 0)
-- Dependencies: 229
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 1, false);


--
-- TOC entry 5073 (class 0 OID 0)
-- Dependencies: 231
-- Name: saved_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.saved_documents_id_seq', 1, false);


--
-- TOC entry 5074 (class 0 OID 0)
-- Dependencies: 233
-- Name: tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tokens_id_seq', 130, true);


--
-- TOC entry 5075 (class 0 OID 0)
-- Dependencies: 235
-- Name: topics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.topics_id_seq', 70, true);


--
-- TOC entry 5076 (class 0 OID 0)
-- Dependencies: 237
-- Name: user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_permissions_id_seq', 1, false);


--
-- TOC entry 5077 (class 0 OID 0)
-- Dependencies: 239
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- TOC entry 4834 (class 2606 OID 90283)
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- TOC entry 4836 (class 2606 OID 90285)
-- Name: admins admins_school_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_school_id_key UNIQUE (school_id);


--
-- TOC entry 4838 (class 2606 OID 90287)
-- Name: authors authors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.authors
    ADD CONSTRAINT authors_pkey PRIMARY KEY (author_id);


--
-- TOC entry 4840 (class 2606 OID 90289)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4842 (class 2606 OID 90291)
-- Name: credentials credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credentials
    ADD CONSTRAINT credentials_pkey PRIMARY KEY (school_id);


--
-- TOC entry 4844 (class 2606 OID 90293)
-- Name: department departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- TOC entry 4868 (class 2606 OID 114756)
-- Name: document_authors document_authors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_authors
    ADD CONSTRAINT document_authors_pkey PRIMARY KEY (document_id, author_id);


--
-- TOC entry 4846 (class 2606 OID 90295)
-- Name: document_topics document_topics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_topics
    ADD CONSTRAINT document_topics_pkey PRIMARY KEY (document_id, topic_id);


--
-- TOC entry 4848 (class 2606 OID 90297)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 4850 (class 2606 OID 90299)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4852 (class 2606 OID 90301)
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 4854 (class 2606 OID 90303)
-- Name: saved_documents saved_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_documents
    ADD CONSTRAINT saved_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 4856 (class 2606 OID 90305)
-- Name: tokens tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4858 (class 2606 OID 90307)
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (id);


--
-- TOC entry 4860 (class 2606 OID 90309)
-- Name: topics unique_topic_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT unique_topic_name UNIQUE (topic_name);


--
-- TOC entry 4862 (class 2606 OID 90311)
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4864 (class 2606 OID 90313)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4866 (class 2606 OID 90315)
-- Name: users users_school_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_school_id_key UNIQUE (school_id);


--
-- TOC entry 4883 (class 2620 OID 90316)
-- Name: authors set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.authors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4869 (class 2606 OID 90317)
-- Name: admins admins_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.department(id) ON DELETE SET NULL;


--
-- TOC entry 4870 (class 2606 OID 90322)
-- Name: admins admins_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.credentials(school_id);


--
-- TOC entry 4871 (class 2606 OID 90327)
-- Name: credentials credentials_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.credentials
    ADD CONSTRAINT credentials_role_fkey FOREIGN KEY (role) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 4881 (class 2606 OID 114762)
-- Name: document_authors document_authors_authors_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_authors
    ADD CONSTRAINT document_authors_authors_id_fkey FOREIGN KEY (author_id) REFERENCES public.authors(author_id) ON DELETE CASCADE;


--
-- TOC entry 4882 (class 2606 OID 114757)
-- Name: document_authors document_authors_documents_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_authors
    ADD CONSTRAINT document_authors_documents_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4872 (class 2606 OID 90332)
-- Name: document_topics document_topics_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_topics
    ADD CONSTRAINT document_topics_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4873 (class 2606 OID 90337)
-- Name: document_topics document_topics_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_topics
    ADD CONSTRAINT document_topics_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE CASCADE;


--
-- TOC entry 4874 (class 2606 OID 90342)
-- Name: documents documents_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- TOC entry 4875 (class 2606 OID 90347)
-- Name: saved_documents saved_documents_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_documents
    ADD CONSTRAINT saved_documents_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4876 (class 2606 OID 90352)
-- Name: saved_documents saved_documents_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_documents
    ADD CONSTRAINT saved_documents_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.users(school_id) ON DELETE CASCADE;


--
-- TOC entry 4877 (class 2606 OID 90357)
-- Name: tokens tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(school_id) ON DELETE CASCADE;


--
-- TOC entry 4878 (class 2606 OID 90362)
-- Name: user_permissions user_permissions_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- TOC entry 4879 (class 2606 OID 90367)
-- Name: user_permissions user_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 4880 (class 2606 OID 90372)
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.department(id) ON DELETE SET NULL;


-- Completed on 2025-04-24 13:21:30

--
-- PostgreSQL database dump complete
--

