--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-03-16 02:15:59

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
-- TOC entry 5038 (class 0 OID 57600)
-- Dependencies: 233
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.admins (id, school_id, department_id) VALUES (1, 'ADMIN-001', 1);


--
-- TOC entry 5039 (class 0 OID 57618)
-- Dependencies: 234
-- Data for Name: authors; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.authors (id, first_name, middle_name, last_name, authorpfp, created_at, updated_at) VALUES (1, 'Alice', 'B', 'Cooper', 'uploads/alice.jpg', '2025-03-16 02:10:08.816254+08', NULL);
INSERT INTO public.authors (id, first_name, middle_name, last_name, authorpfp, created_at, updated_at) VALUES (2, 'Bob', NULL, 'Marley', 'uploads/bob.jpg', '2025-03-16 02:10:08.816254+08', '2025-03-16 02:10:08.816254+08');


--
-- TOC entry 5035 (class 0 OID 57571)
-- Dependencies: 230
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.categories (id, category_name) VALUES (1, 'Thesis');
INSERT INTO public.categories (id, category_name) VALUES (2, 'Dissertation');
INSERT INTO public.categories (id, category_name) VALUES (3, 'Research Paper');


--
-- TOC entry 5034 (class 0 OID 57559)
-- Dependencies: 229
-- Data for Name: credentials; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.credentials (school_id, password, role) VALUES ('ADMIN-001', 'adminpass123', 1);
INSERT INTO public.credentials (school_id, password, role) VALUES ('USER-001', 'userpass123', 2);
INSERT INTO public.credentials (school_id, password, role) VALUES ('USER-002', 'userpass456', 2);


--
-- TOC entry 5037 (class 0 OID 57587)
-- Dependencies: 232
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.departments (id, cbit, cons, casee, baed, faculty, staff, grad_school) VALUES (1, true, false, false, false, true, false, false);
INSERT INTO public.departments (id, cbit, cons, casee, baed, faculty, staff, grad_school) VALUES (2, false, true, false, false, false, true, false);


--
-- TOC entry 5041 (class 0 OID 57641)
-- Dependencies: 236
-- Data for Name: document_topics; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.document_topics (document_id, topic_id) VALUES (1, 1);
INSERT INTO public.document_topics (document_id, topic_id) VALUES (2, 2);


--
-- TOC entry 5040 (class 0 OID 57627)
-- Dependencies: 235
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.documents (id, title, topic, author, category, pages, publication_date, location_path, category_id) VALUES (1, 'AI in Education', 'Artificial Intelligence', 'Alice Cooper', 'Thesis', 120, '2024-01-10', 'docs/ai_edu.pdf', 1);
INSERT INTO public.documents (id, title, topic, author, category, pages, publication_date, location_path, category_id) VALUES (2, 'Quantum Computing Basics', 'Quantum Science', 'Bob Marley', 'Research Paper', 80, '2023-12-05', 'docs/quantum.pdf', 3);


--
-- TOC entry 5033 (class 0 OID 57550)
-- Dependencies: 228
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.roles (id, role_name) VALUES (1, 'Isadmin');
INSERT INTO public.roles (id, role_name) VALUES (2, 'Isregistered');


--
-- TOC entry 5042 (class 0 OID 57656)
-- Dependencies: 237
-- Data for Name: saved_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.saved_documents (id, school_id, document_id, date_saved) VALUES (1, 'USER-001', 1, '2025-03-16 02:10:08.816254');
INSERT INTO public.saved_documents (id, school_id, document_id, date_saved) VALUES (2, 'USER-002', 2, '2025-03-16 02:10:08.816254');


--
-- TOC entry 5043 (class 0 OID 57673)
-- Dependencies: 238
-- Data for Name: tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tokens (id, token, user_id, user_role, created_at) VALUES (1, 'abc123', 'USER-001', 'Isregistered', '2025-03-16 02:10:08.816254');
INSERT INTO public.tokens (id, token, user_id, user_role, created_at) VALUES (2, 'xyz789', 'ADMIN-001', 'Isadmin', '2025-03-16 02:10:08.816254');


--
-- TOC entry 5036 (class 0 OID 57579)
-- Dependencies: 231
-- Data for Name: topics; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.topics (id, topic_name) VALUES (1, 'Artificial Intelligence');
INSERT INTO public.topics (id, topic_name) VALUES (2, 'Quantum Computing');


--
-- TOC entry 5044 (class 0 OID 57684)
-- Dependencies: 239
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.user_permissions (id, role_id, document_id, can_read, can_write, can_edit, can_delete) VALUES (1, 2, 1, true, false, false, false);
INSERT INTO public.user_permissions (id, role_id, document_id, can_read, can_write, can_edit, can_delete) VALUES (2, 1, 2, true, true, true, true);


--
-- TOC entry 5045 (class 0 OID 57704)
-- Dependencies: 240
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users (id, school_id, department, saved_documents, history, department_id, first_name, middle_name, last_name) VALUES (1, 'USER-001', 'CBit', '{Doc1,Doc2}', '{DocA}', 1, 'John', 'Doe', 'Smith');
INSERT INTO public.users (id, school_id, department, saved_documents, history, department_id, first_name, middle_name, last_name) VALUES (2, 'USER-002', 'Casee', '{Doc3}', '{DocB,DocC}', 2, 'Jane', 'Ann', 'Doe');


--
-- TOC entry 5051 (class 0 OID 0)
-- Dependencies: 217
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_id_seq', 1, false);


--
-- TOC entry 5052 (class 0 OID 0)
-- Dependencies: 218
-- Name: authors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.authors_id_seq', 1, false);


--
-- TOC entry 5053 (class 0 OID 0)
-- Dependencies: 219
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 1, false);


--
-- TOC entry 5054 (class 0 OID 0)
-- Dependencies: 220
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 1, false);


--
-- TOC entry 5055 (class 0 OID 0)
-- Dependencies: 221
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 1, false);


--
-- TOC entry 5056 (class 0 OID 0)
-- Dependencies: 222
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 1, false);


--
-- TOC entry 5057 (class 0 OID 0)
-- Dependencies: 223
-- Name: saved_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.saved_documents_id_seq', 1, false);


--
-- TOC entry 5058 (class 0 OID 0)
-- Dependencies: 224
-- Name: tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tokens_id_seq', 1, false);


--
-- TOC entry 5059 (class 0 OID 0)
-- Dependencies: 225
-- Name: topics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.topics_id_seq', 1, false);


--
-- TOC entry 5060 (class 0 OID 0)
-- Dependencies: 226
-- Name: user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_permissions_id_seq', 1, false);


--
-- TOC entry 5061 (class 0 OID 0)
-- Dependencies: 227
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


-- Completed on 2025-03-16 02:16:00

--
-- PostgreSQL database dump complete
--

