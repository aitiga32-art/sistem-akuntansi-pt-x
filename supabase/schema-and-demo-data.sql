-- PT X: migrasi PostgreSQL lokal ke Supabase.
-- Dibuat tanpa DROP, tanpa owner, dan tanpa privilege agar aman untuk project baru.
-- Jalankan hanya pada project Supabase PT X yang kosong.
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_sheet_rows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_sheet_rows (
    source_key text NOT NULL,
    sheet_name text NOT NULL,
    row_number integer NOT NULL,
    row_values jsonb NOT NULL,
    row_display_values jsonb,
    updated_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: app_sheet_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_sheet_sources (
    source_key text NOT NULL,
    source_type text,
    module text,
    source_name text,
    spreadsheet_id text,
    spreadsheet_url text,
    sheet_count integer DEFAULT 0 NOT NULL,
    row_count integer DEFAULT 0 NOT NULL,
    data_bytes bigint DEFAULT 0 NOT NULL,
    status text DEFAULT 'ready'::text NOT NULL,
    error_message text,
    updated_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: app_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    legacy_id text,
    full_name text NOT NULL,
    username text NOT NULL,
    password_hash text,
    password_plain text,
    role text DEFAULT 'User'::text NOT NULL,
    "position" text,
    division text,
    employment_status text DEFAULT 'Karyawan'::text NOT NULL,
    allowed_module_ids jsonb,
    allowed_client_names jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bre_cash_on_hold_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bre_cash_on_hold_settings (
    setting_key text NOT NULL,
    account_names jsonb DEFAULT '[]'::jsonb NOT NULL,
    updated_by text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bre_ppn_masukan_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bre_ppn_masukan_overrides (
    source_module text NOT NULL,
    source_row_number integer NOT NULL,
    masa_pengkreditan text,
    updated_by text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bre_sheet_rows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bre_sheet_rows (
    module text NOT NULL,
    legacy_row_number integer NOT NULL,
    row_values jsonb NOT NULL,
    row_display_values jsonb,
    updated_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    username text NOT NULL,
    email text DEFAULT ''::text NOT NULL,
    password_hash text DEFAULT ''::text NOT NULL,
    display_name text DEFAULT ''::text NOT NULL,
    contact_name text DEFAULT ''::text NOT NULL,
    phone text DEFAULT ''::text NOT NULL,
    account_role text DEFAULT 'client'::text NOT NULL,
    business_entity_key text DEFAULT ''::text NOT NULL,
    business_entity_name text DEFAULT ''::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    force_password_change boolean DEFAULT false NOT NULL,
    last_login_at timestamp with time zone,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_activity_log (
    id bigint NOT NULL,
    account_id uuid,
    client_id text DEFAULT ''::text NOT NULL,
    event_type text NOT NULL,
    status text DEFAULT 'success'::text NOT NULL,
    detail text DEFAULT ''::text NOT NULL,
    ip_address text DEFAULT ''::text NOT NULL,
    user_agent text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_activity_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.client_portal_activity_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: client_portal_activity_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.client_portal_activity_log_id_seq OWNED BY public.client_portal_activity_log.id;


--
-- Name: client_portal_aktiva_penyusutan_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_aktiva_penyusutan_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    business_entity_key text DEFAULT ''::text NOT NULL,
    business_entity_name text DEFAULT ''::text NOT NULL,
    asset_type text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    acquisition_date date NOT NULL,
    acquisition_cost numeric(18,2) DEFAULT 0 NOT NULL,
    asset_group text DEFAULT 'kelompok-1'::text NOT NULL,
    useful_life_months integer DEFAULT 48 NOT NULL,
    annual_rate numeric(8,4) DEFAULT 25 NOT NULL,
    depreciation_method text DEFAULT 'garis_lurus'::text NOT NULL,
    asset_coa text DEFAULT '1-6004'::text NOT NULL,
    asset_account_name text DEFAULT 'INVENTARIS KANTOR'::text NOT NULL,
    accumulated_coa text DEFAULT '1-7001'::text NOT NULL,
    accumulated_account_name text DEFAULT 'AKM PENYUSUTAN'::text NOT NULL,
    expense_coa text DEFAULT '6-1001'::text NOT NULL,
    expense_account_name text DEFAULT 'BIAYA PENYUSUTAN'::text NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    attachment_name text DEFAULT ''::text NOT NULL,
    attachment_mime_type text DEFAULT ''::text NOT NULL,
    attachment_size bigint DEFAULT 0 NOT NULL,
    attachment_data_url text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    purchase_source_type text DEFAULT ''::text NOT NULL,
    purchase_source_key text DEFAULT ''::text NOT NULL,
    purchase_source_coa text DEFAULT ''::text NOT NULL,
    purchase_source_account_name text DEFAULT ''::text NOT NULL,
    sale_date date,
    sale_amount numeric(18,2) DEFAULT 0 NOT NULL,
    sale_source_type text DEFAULT ''::text NOT NULL,
    sale_source_key text DEFAULT ''::text NOT NULL,
    sale_source_coa text DEFAULT ''::text NOT NULL,
    sale_source_account_name text DEFAULT ''::text NOT NULL,
    sale_notes text DEFAULT ''::text NOT NULL,
    entry_source text DEFAULT 'purchase'::text NOT NULL,
    opening_accumulated_depreciation numeric(18,2) DEFAULT 0 NOT NULL
);


--
-- Name: client_portal_book_closing_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_book_closing_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    closing_date date NOT NULL,
    period_year integer NOT NULL,
    period_month integer NOT NULL,
    adjustment_entry_id uuid,
    profit_amount numeric(18,2) DEFAULT 0 NOT NULL,
    debit_lines jsonb DEFAULT '[]'::jsonb NOT NULL,
    credit_lines jsonb DEFAULT '[]'::jsonb NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    is_reversed boolean DEFAULT false NOT NULL,
    reversed_at timestamp with time zone,
    reversed_by text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_buku_bank_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_buku_bank_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    business_entity_key text DEFAULT ''::text NOT NULL,
    business_entity_name text DEFAULT ''::text NOT NULL,
    bank_key text NOT NULL,
    entry_date date NOT NULL,
    coa_code text NOT NULL,
    account_name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    money_in numeric(16,2) DEFAULT 0 NOT NULL,
    money_out numeric(16,2) DEFAULT 0 NOT NULL,
    tax_type text DEFAULT ''::text NOT NULL,
    attachment_name text DEFAULT ''::text NOT NULL,
    attachment_mime_type text DEFAULT ''::text NOT NULL,
    attachment_size bigint DEFAULT 0 NOT NULL,
    attachment_data_url text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    mirror_source_table text DEFAULT ''::text NOT NULL,
    mirror_source_id text DEFAULT ''::text NOT NULL,
    mirror_source_detail_key text DEFAULT ''::text NOT NULL
);


--
-- Name: client_portal_buku_kas_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_buku_kas_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    business_entity_key text DEFAULT ''::text NOT NULL,
    business_entity_name text DEFAULT ''::text NOT NULL,
    entry_date date NOT NULL,
    coa_code text NOT NULL,
    account_name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    money_in numeric(16,2) DEFAULT 0 NOT NULL,
    money_out numeric(16,2) DEFAULT 0 NOT NULL,
    tax_type text DEFAULT ''::text NOT NULL,
    attachment_name text DEFAULT ''::text NOT NULL,
    attachment_mime_type text DEFAULT ''::text NOT NULL,
    attachment_size bigint DEFAULT 0 NOT NULL,
    attachment_data_url text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    cash_book_key text DEFAULT 'kas-kecil'::text NOT NULL,
    mirror_source_table text DEFAULT ''::text NOT NULL,
    mirror_source_id text DEFAULT ''::text NOT NULL,
    mirror_source_detail_key text DEFAULT ''::text NOT NULL
);


--
-- Name: client_portal_buku_pembelian_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_buku_pembelian_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    business_entity_key text DEFAULT ''::text NOT NULL,
    business_entity_name text DEFAULT ''::text NOT NULL,
    invoice_date date NOT NULL,
    faktur_date date,
    faktur_no text DEFAULT ''::text NOT NULL,
    invoice_no text DEFAULT ''::text NOT NULL,
    do_no text DEFAULT ''::text NOT NULL,
    sale_no text DEFAULT ''::text NOT NULL,
    quantity numeric(12,2) DEFAULT 1 NOT NULL,
    item_name text DEFAULT ''::text NOT NULL,
    color text DEFAULT ''::text NOT NULL,
    frame_no text DEFAULT ''::text NOT NULL,
    engine_no text DEFAULT ''::text NOT NULL,
    variant_code text DEFAULT ''::text NOT NULL,
    price numeric(16,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(16,2) DEFAULT 0 NOT NULL,
    dpp numeric(16,2) DEFAULT 0 NOT NULL,
    ppn numeric(16,2) DEFAULT 0 NOT NULL,
    pph22 numeric(16,2) DEFAULT 0 NOT NULL,
    pph22_initialized boolean DEFAULT false NOT NULL,
    total_amount numeric(16,2) DEFAULT 0 NOT NULL,
    pelunasan_date date,
    pelunasan_amount numeric(16,2) DEFAULT 0 NOT NULL,
    pelunasan_notes text DEFAULT ''::text NOT NULL,
    pelunasan_source_type text DEFAULT ''::text NOT NULL,
    pelunasan_source_key text DEFAULT ''::text NOT NULL,
    pelunasan_source_coa text DEFAULT ''::text NOT NULL,
    pelunasan_source_account_name text DEFAULT ''::text NOT NULL,
    outlet text DEFAULT ''::text NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_buku_penjualan_dp_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_buku_penjualan_dp_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    receipt_no text NOT NULL,
    receipt_sequence integer DEFAULT 0 NOT NULL,
    receipt_month integer DEFAULT 0 NOT NULL,
    receipt_year integer DEFAULT 0 NOT NULL,
    entry_date date NOT NULL,
    frame_no text DEFAULT ''::text NOT NULL,
    motor_type text DEFAULT ''::text NOT NULL,
    engine_no text DEFAULT ''::text NOT NULL,
    color text DEFAULT ''::text NOT NULL,
    customer_name text DEFAULT ''::text NOT NULL,
    customer_nik_npwp text DEFAULT ''::text NOT NULL,
    customer_address text DEFAULT ''::text NOT NULL,
    price_list numeric(16,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(16,2) DEFAULT 0 NOT NULL,
    price_after_discount numeric(16,2) DEFAULT 0 NOT NULL,
    dp_customer numeric(16,2) DEFAULT 0 NOT NULL,
    dp_additional numeric(16,2) DEFAULT 0 NOT NULL,
    dp_total numeric(16,2) DEFAULT 0 NOT NULL,
    bbn_notice numeric(16,2) DEFAULT 0 NOT NULL,
    taxable_delivery_value numeric(16,2) DEFAULT 0 NOT NULL,
    bbn_unnotice numeric(16,2) DEFAULT 0 NOT NULL,
    dpp numeric(16,2) DEFAULT 0 NOT NULL,
    ppn numeric(16,2) DEFAULT 0 NOT NULL,
    dpp_ppn numeric(16,2) DEFAULT 0 NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    attachment_name text DEFAULT ''::text NOT NULL,
    attachment_mime_type text DEFAULT ''::text NOT NULL,
    attachment_size bigint DEFAULT 0 NOT NULL,
    attachment_data_url text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_entity_key text DEFAULT ''::text NOT NULL,
    business_entity_name text DEFAULT ''::text NOT NULL,
    quantity numeric(18,2) DEFAULT 1 NOT NULL
);


--
-- Name: client_portal_buku_penjualan_faktur_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_buku_penjualan_faktur_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    dp_entry_id uuid NOT NULL,
    faktur_no text DEFAULT ''::text NOT NULL,
    faktur_date date,
    attachment_name text DEFAULT ''::text NOT NULL,
    attachment_mime_type text DEFAULT ''::text NOT NULL,
    attachment_size bigint DEFAULT 0 NOT NULL,
    attachment_data_url text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_buku_penjualan_lengkap_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_buku_penjualan_lengkap_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    entry_date date NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    attachment_name text DEFAULT ''::text NOT NULL,
    attachment_mime_type text DEFAULT ''::text NOT NULL,
    attachment_size bigint DEFAULT 0 NOT NULL,
    attachment_data_url text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    receipt_no text DEFAULT ''::text NOT NULL,
    receipt_sequence integer DEFAULT 0 NOT NULL,
    receipt_month integer DEFAULT 0 NOT NULL,
    receipt_year integer DEFAULT 0 NOT NULL,
    invoice_no text DEFAULT ''::text NOT NULL,
    invoice_sequence integer DEFAULT 0 NOT NULL,
    invoice_month integer DEFAULT 0 NOT NULL,
    invoice_year integer DEFAULT 0 NOT NULL,
    invoice_date date,
    frame_no text DEFAULT ''::text NOT NULL,
    motor_type text DEFAULT ''::text NOT NULL,
    engine_no text DEFAULT ''::text NOT NULL,
    color text DEFAULT ''::text NOT NULL,
    customer_name text DEFAULT ''::text NOT NULL,
    customer_nik_npwp text DEFAULT ''::text NOT NULL,
    customer_address text DEFAULT ''::text NOT NULL,
    business_entity_key text DEFAULT ''::text NOT NULL,
    business_entity_name text DEFAULT ''::text NOT NULL,
    quantity numeric(18,2) DEFAULT 1 NOT NULL,
    price_list numeric(18,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(18,2) DEFAULT 0 NOT NULL,
    price_after_discount numeric(18,2) DEFAULT 0 NOT NULL,
    bbn_notice numeric(18,2) DEFAULT 0 NOT NULL,
    taxable_delivery_value numeric(18,2) DEFAULT 0 NOT NULL,
    dpp numeric(18,2) DEFAULT 0 NOT NULL,
    ppn numeric(18,2) DEFAULT 0 NOT NULL,
    dpp_ppn numeric(18,2) DEFAULT 0 NOT NULL,
    total_invoice numeric(18,2) DEFAULT 0 NOT NULL
);


--
-- Name: client_portal_buku_penjualan_pelunasan_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_buku_penjualan_pelunasan_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    dp_entry_id uuid,
    dp_receipt_no text NOT NULL,
    invoice_no text NOT NULL,
    invoice_sequence integer DEFAULT 0 NOT NULL,
    invoice_month integer DEFAULT 0 NOT NULL,
    invoice_year integer DEFAULT 0 NOT NULL,
    invoice_date date NOT NULL,
    discount_additional numeric(16,2) DEFAULT 0 NOT NULL,
    price_after_discount numeric(16,2) DEFAULT 0 NOT NULL,
    dp_paid numeric(16,2) DEFAULT 0 NOT NULL,
    bbn_notice numeric(16,2) DEFAULT 0 NOT NULL,
    taxable_settlement_value numeric(16,2) DEFAULT 0 NOT NULL,
    dpp_settlement numeric(16,2) DEFAULT 0 NOT NULL,
    ppn_settlement numeric(16,2) DEFAULT 0 NOT NULL,
    dpp_ppn_settlement numeric(16,2) DEFAULT 0 NOT NULL,
    pelunasan_source_type text DEFAULT 'kas'::text NOT NULL,
    pelunasan_source_key text DEFAULT 'kas-besar'::text NOT NULL,
    pelunasan_source_coa text DEFAULT '1-1003'::text NOT NULL,
    pelunasan_source_account_name text DEFAULT 'KAS 2'::text NOT NULL,
    pelunasan_payment_rows jsonb DEFAULT '[]'::jsonb NOT NULL,
    pelunasan_notes text DEFAULT ''::text NOT NULL,
    attachment_name text DEFAULT ''::text NOT NULL,
    attachment_mime_type text DEFAULT ''::text NOT NULL,
    attachment_size bigint DEFAULT 0 NOT NULL,
    attachment_data_url text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_entity_key text DEFAULT ''::text NOT NULL,
    business_entity_name text DEFAULT ''::text NOT NULL,
    complete_entry_id uuid
);


--
-- Name: client_portal_buku_persediaan_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_buku_persediaan_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    business_entity_key text DEFAULT ''::text NOT NULL,
    business_entity_name text DEFAULT ''::text NOT NULL,
    source_purchase_id uuid NOT NULL,
    stock_date date NOT NULL,
    source_type text DEFAULT 'pembelian_unit'::text NOT NULL,
    source_no text DEFAULT ''::text NOT NULL,
    item_name text DEFAULT ''::text NOT NULL,
    color text DEFAULT ''::text NOT NULL,
    frame_no text DEFAULT ''::text NOT NULL,
    engine_no text DEFAULT ''::text NOT NULL,
    quantity_in numeric(12,2) DEFAULT 1 NOT NULL,
    quantity_out numeric(12,2) DEFAULT 0 NOT NULL,
    dpp numeric(16,2) DEFAULT 0 NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_coa_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_coa_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    coa_code text NOT NULL,
    account_name text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_data_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_data_migrations (
    migration_id text NOT NULL,
    client_id text NOT NULL,
    client_name text DEFAULT ''::text NOT NULL,
    deleted_counts jsonb DEFAULT '{}'::jsonb NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_document_sequences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_document_sequences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    document_key text NOT NULL,
    period_key text DEFAULT ''::text NOT NULL,
    last_sequence integer DEFAULT 0 NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_fiscal_correction_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_fiscal_correction_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    period_year integer NOT NULL,
    correction_type text DEFAULT 'positive'::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    amount numeric(18,2) DEFAULT 0 NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_hti_advance_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_hti_advance_allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    advance_id uuid NOT NULL,
    source_table text NOT NULL,
    source_entry_id text NOT NULL,
    payment_index integer DEFAULT 0 NOT NULL,
    allocation_date date NOT NULL,
    amount numeric(16,2) DEFAULT 0 NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_hti_advance_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_hti_advance_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    bank_key text NOT NULL,
    bank_entry_id text DEFAULT ''::text NOT NULL,
    advance_type text DEFAULT 'purchase'::text NOT NULL,
    project_no text DEFAULT ''::text NOT NULL,
    party_code text DEFAULT ''::text NOT NULL,
    party_name text DEFAULT ''::text NOT NULL,
    entry_date date NOT NULL,
    amount numeric(16,2) DEFAULT 0 NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    attachment_name text DEFAULT ''::text NOT NULL,
    attachment_mime_type text DEFAULT ''::text NOT NULL,
    attachment_size bigint DEFAULT 0 NOT NULL,
    attachment_data_url text DEFAULT ''::text NOT NULL,
    allocated_amount numeric(16,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'unallocated'::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_hti_bank_interest_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_hti_bank_interest_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    bank_key text NOT NULL,
    entry_date date NOT NULL,
    income_amount numeric(18,2) DEFAULT 0 NOT NULL,
    admin_amount numeric(18,2) DEFAULT 0 NOT NULL,
    fee_rows jsonb DEFAULT '[]'::jsonb NOT NULL,
    attachment_name text DEFAULT ''::text NOT NULL,
    attachment_mime_type text DEFAULT ''::text NOT NULL,
    attachment_size bigint DEFAULT 0 NOT NULL,
    attachment_data_url text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source_entry_ids jsonb DEFAULT '[]'::jsonb NOT NULL
);


--
-- Name: client_portal_hti_customer_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_hti_customer_master (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    customer_code text NOT NULL,
    customer_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_npwp text DEFAULT ''::text NOT NULL,
    customer_address text DEFAULT ''::text NOT NULL
);


--
-- Name: client_portal_hti_expense_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_hti_expense_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    expense_type text DEFAULT 'routine'::text NOT NULL,
    project_no text DEFAULT ''::text NOT NULL,
    entry_date date NOT NULL,
    source_type text DEFAULT 'bank'::text NOT NULL,
    source_key text DEFAULT ''::text NOT NULL,
    source_label text DEFAULT ''::text NOT NULL,
    source_coa text DEFAULT ''::text NOT NULL,
    source_account_name text DEFAULT ''::text NOT NULL,
    expense_coa text NOT NULL,
    expense_account_name text NOT NULL,
    amount numeric(18,2) DEFAULT 0 NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    project_allocated boolean DEFAULT false NOT NULL,
    source_entry_id text DEFAULT ''::text NOT NULL,
    attachment_name text DEFAULT ''::text NOT NULL,
    attachment_mime_type text DEFAULT ''::text NOT NULL,
    attachment_size bigint DEFAULT 0 NOT NULL,
    attachment_data_url text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_hti_project_controls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_hti_project_controls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    project_no text NOT NULL,
    is_closed boolean DEFAULT false NOT NULL,
    closed_at timestamp with time zone,
    closed_by text DEFAULT ''::text NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_hti_purchase_fp_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_hti_purchase_fp_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    project_no text DEFAULT ''::text NOT NULL,
    supplier_npwp text DEFAULT ''::text NOT NULL,
    supplier_name text DEFAULT ''::text NOT NULL,
    item_name text DEFAULT ''::text NOT NULL,
    faktur_no text DEFAULT ''::text NOT NULL,
    faktur_date date,
    faktur_date_text text DEFAULT ''::text NOT NULL,
    invoice_no text DEFAULT ''::text NOT NULL,
    invoice_date date,
    invoice_date_text text DEFAULT ''::text NOT NULL,
    quantity numeric(18,3) DEFAULT 0 NOT NULL,
    unit_price numeric(18,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(18,2) DEFAULT 0 NOT NULL,
    discount_mode text DEFAULT 'dpp'::text NOT NULL,
    dpp numeric(18,2) DEFAULT 0 NOT NULL,
    ppn_rate numeric(6,3) DEFAULT 11 NOT NULL,
    ppn numeric(18,2) DEFAULT 0 NOT NULL,
    total_amount numeric(18,2) DEFAULT 0 NOT NULL,
    payment_date date,
    payment_source text DEFAULT ''::text NOT NULL,
    payment_amount numeric(18,2) DEFAULT 0 NOT NULL,
    payment_notes text DEFAULT ''::text NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    source_file text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    documents_uploaded boolean DEFAULT false NOT NULL,
    attachment_name text DEFAULT ''::text NOT NULL,
    attachment_mime_type text DEFAULT ''::text NOT NULL,
    attachment_size bigint DEFAULT 0 NOT NULL,
    attachment_data_url text DEFAULT ''::text NOT NULL,
    payment_rows jsonb DEFAULT '[]'::jsonb NOT NULL,
    transaction_group_id text DEFAULT ''::text NOT NULL
);


--
-- Name: client_portal_hti_purchase_non_ppn_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_hti_purchase_non_ppn_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    project_no text DEFAULT ''::text NOT NULL,
    supplier_npwp text DEFAULT ''::text NOT NULL,
    supplier_name text DEFAULT ''::text NOT NULL,
    item_name text DEFAULT ''::text NOT NULL,
    faktur_no text DEFAULT ''::text NOT NULL,
    faktur_date date,
    faktur_date_text text DEFAULT ''::text NOT NULL,
    invoice_no text DEFAULT ''::text NOT NULL,
    invoice_date date,
    invoice_date_text text DEFAULT ''::text NOT NULL,
    quantity numeric(18,3) DEFAULT 0 NOT NULL,
    unit_price numeric(18,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(18,2) DEFAULT 0 NOT NULL,
    discount_mode text DEFAULT 'dpp'::text NOT NULL,
    dpp numeric(18,2) DEFAULT 0 NOT NULL,
    total_amount numeric(18,2) DEFAULT 0 NOT NULL,
    payment_date date,
    payment_source text DEFAULT ''::text NOT NULL,
    payment_amount numeric(18,2) DEFAULT 0 NOT NULL,
    payment_notes text DEFAULT ''::text NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    documents_uploaded boolean DEFAULT false NOT NULL,
    attachment_name text DEFAULT ''::text NOT NULL,
    attachment_mime_type text DEFAULT ''::text NOT NULL,
    attachment_size bigint DEFAULT 0 NOT NULL,
    attachment_data_url text DEFAULT ''::text NOT NULL,
    source_file text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_rows jsonb DEFAULT '[]'::jsonb NOT NULL,
    transaction_group_id text DEFAULT ''::text NOT NULL
);


--
-- Name: client_portal_hti_sales_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_hti_sales_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    project_no text DEFAULT ''::text NOT NULL,
    customer_npwp text DEFAULT ''::text NOT NULL,
    customer_name text DEFAULT ''::text NOT NULL,
    item_name text DEFAULT ''::text NOT NULL,
    fp_purchase_no text DEFAULT ''::text NOT NULL,
    faktur_no text DEFAULT ''::text NOT NULL,
    faktur_date date,
    faktur_date_text text DEFAULT ''::text NOT NULL,
    invoice_no text DEFAULT ''::text NOT NULL,
    invoice_date date,
    invoice_date_text text DEFAULT ''::text NOT NULL,
    quantity numeric(18,3) DEFAULT 0 NOT NULL,
    unit_price numeric(18,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(18,2) DEFAULT 0 NOT NULL,
    dpp numeric(18,2) DEFAULT 0 NOT NULL,
    ppn_rate numeric(6,3) DEFAULT 11 NOT NULL,
    ppn numeric(18,2) DEFAULT 0 NOT NULL,
    total_amount numeric(18,2) DEFAULT 0 NOT NULL,
    payment_date date,
    payment_source text DEFAULT ''::text NOT NULL,
    payment_amount numeric(18,2) DEFAULT 0 NOT NULL,
    payment_notes text DEFAULT ''::text NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    documents_uploaded boolean DEFAULT false NOT NULL,
    attachment_name text DEFAULT ''::text NOT NULL,
    attachment_mime_type text DEFAULT ''::text NOT NULL,
    attachment_size bigint DEFAULT 0 NOT NULL,
    attachment_data_url text DEFAULT ''::text NOT NULL,
    source_file text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_code text DEFAULT ''::text NOT NULL,
    customer_address text DEFAULT ''::text NOT NULL,
    payment_rows jsonb DEFAULT '[]'::jsonb NOT NULL,
    transaction_group_id text DEFAULT ''::text NOT NULL,
    document_type text DEFAULT 'faktur'::text NOT NULL
);


--
-- Name: client_portal_hti_supplier_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_hti_supplier_master (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    supplier_code text NOT NULL,
    supplier_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_jurnal_adjustment_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_jurnal_adjustment_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    business_entity_key text DEFAULT ''::text NOT NULL,
    business_entity_name text DEFAULT ''::text NOT NULL,
    entry_date date NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    debit_lines jsonb DEFAULT '[]'::jsonb NOT NULL,
    credit_lines jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_debit numeric(18,2) DEFAULT 0 NOT NULL,
    total_credit numeric(18,2) DEFAULT 0 NOT NULL,
    attachment_name text DEFAULT ''::text NOT NULL,
    attachment_mime_type text DEFAULT ''::text NOT NULL,
    attachment_size bigint DEFAULT 0 NOT NULL,
    attachment_data_url text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    journal_type text DEFAULT 'adjustment'::text NOT NULL
);


--
-- Name: client_portal_mobile_upload_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_mobile_upload_sessions (
    token text NOT NULL,
    client_id text NOT NULL,
    account_id text DEFAULT ''::text NOT NULL,
    label text DEFAULT 'Upload File'::text NOT NULL,
    files_json jsonb DEFAULT '[]'::jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_neraca_lajur_opening_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_neraca_lajur_opening_balances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    coa_code text NOT NULL,
    account_name text DEFAULT ''::text NOT NULL,
    opening_debit numeric(18,2) DEFAULT 0 NOT NULL,
    opening_credit numeric(18,2) DEFAULT 0 NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_period_postings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_period_postings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    period_year integer NOT NULL,
    period_month integer NOT NULL,
    is_posted boolean DEFAULT true NOT NULL,
    posted_at timestamp with time zone,
    posted_by text DEFAULT ''::text NOT NULL,
    unposted_at timestamp with time zone,
    unposted_by text DEFAULT ''::text NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_po_customer_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_po_customer_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    item_no text DEFAULT ''::text NOT NULL,
    po_no text DEFAULT ''::text NOT NULL,
    po_date date NOT NULL,
    customer_name text DEFAULT ''::text NOT NULL,
    product_name text DEFAULT ''::text NOT NULL,
    brand_type text DEFAULT ''::text NOT NULL,
    specification text DEFAULT ''::text NOT NULL,
    illustration text DEFAULT ''::text NOT NULL,
    unit text DEFAULT ''::text NOT NULL,
    unit_price numeric(18,2) DEFAULT 0 NOT NULL,
    requested_qty numeric(18,2) DEFAULT 0 NOT NULL,
    requested_total numeric(18,2) DEFAULT 0 NOT NULL,
    requested_dpp numeric(18,2) DEFAULT 0 NOT NULL,
    requested_ppn numeric(18,2) DEFAULT 0 NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    supplier_name text DEFAULT ''::text NOT NULL,
    purchase_invoice_no text DEFAULT ''::text NOT NULL,
    purchase_date date,
    purchase_unit_price numeric(18,2) DEFAULT 0 NOT NULL,
    purchase_qty numeric(18,2) DEFAULT 0 NOT NULL,
    purchase_total numeric(18,2) DEFAULT 0 NOT NULL,
    purchase_tax_mode text DEFAULT 'non_ppn'::text NOT NULL,
    purchase_dpp numeric(18,2) DEFAULT 0 NOT NULL,
    purchase_ppn numeric(18,2) DEFAULT 0 NOT NULL,
    purchase_lines jsonb DEFAULT '[]'::jsonb NOT NULL,
    realization_notes text DEFAULT ''::text NOT NULL,
    attachment_name text DEFAULT ''::text NOT NULL,
    attachment_mime_type text DEFAULT ''::text NOT NULL,
    attachment_size bigint DEFAULT 0 NOT NULL,
    attachment_data_url text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_tbb_fish_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_tbb_fish_master (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    fish_code text NOT NULL,
    fish_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_tbb_purchase_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_tbb_purchase_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    sales_invoice_no text DEFAULT ''::text NOT NULL,
    document_no text NOT NULL,
    purchase_date date NOT NULL,
    supplier_code text DEFAULT ''::text NOT NULL,
    supplier_name text DEFAULT ''::text NOT NULL,
    supplier_address text DEFAULT ''::text NOT NULL,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_tagihan numeric(18,2) DEFAULT 0 NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    attachment_name text DEFAULT ''::text NOT NULL,
    attachment_mime_type text DEFAULT ''::text NOT NULL,
    attachment_size bigint DEFAULT 0 NOT NULL,
    attachment_data_url text DEFAULT ''::text NOT NULL
);


--
-- Name: client_portal_tbb_sales_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_tbb_sales_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    invoice_no text NOT NULL,
    invoice_date date NOT NULL,
    customer_name text DEFAULT 'PT CUSTOMER CONTOH'::text NOT NULL,
    customer_address text DEFAULT ''::text NOT NULL,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    dpp numeric(18,2) DEFAULT 0 NOT NULL,
    ppn numeric(18,2) DEFAULT 0 NOT NULL,
    pph22 numeric(18,2) DEFAULT 0 NOT NULL,
    total_tagihan numeric(18,2) DEFAULT 0 NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_code text DEFAULT 'CUS'::text NOT NULL,
    customer_identity_no text DEFAULT ''::text NOT NULL,
    reference_text text DEFAULT ''::text NOT NULL,
    attachment_name text DEFAULT ''::text NOT NULL,
    attachment_mime_type text DEFAULT ''::text NOT NULL,
    attachment_size bigint DEFAULT 0 NOT NULL,
    attachment_data_url text DEFAULT ''::text NOT NULL
);


--
-- Name: client_portal_tbb_settlement_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_tbb_settlement_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    settlement_type text NOT NULL,
    mode text DEFAULT 'invoice'::text NOT NULL,
    document_no text NOT NULL,
    settlement_date date NOT NULL,
    entity_code text DEFAULT ''::text NOT NULL,
    entity_name text DEFAULT ''::text NOT NULL,
    lines jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_amount numeric(18,2) DEFAULT 0 NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'client_portal'::text NOT NULL,
    updated_by text DEFAULT 'client_portal'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    attachment_name text DEFAULT ''::text NOT NULL,
    attachment_mime_type text DEFAULT ''::text NOT NULL,
    attachment_size bigint DEFAULT 0 NOT NULL,
    attachment_data_url text DEFAULT ''::text NOT NULL
);


--
-- Name: client_portal_tbb_supplier_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_portal_tbb_supplier_master (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    supplier_code text NOT NULL,
    supplier_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    legacy_row_number integer,
    jenis_wp text DEFAULT ''::text NOT NULL,
    nama_klien text DEFAULT ''::text NOT NULL,
    nik_npwp text DEFAULT ''::text NOT NULL,
    alamat text DEFAULT ''::text NOT NULL,
    nik_pic text DEFAULT ''::text NOT NULL,
    pass_pic text DEFAULT ''::text NOT NULL,
    pass_coretax text DEFAULT ''::text NOT NULL,
    passphrase_coretax text DEFAULT ''::text NOT NULL,
    email text DEFAULT ''::text NOT NULL,
    pass_email text DEFAULT ''::text NOT NULL,
    pass_email_backup text DEFAULT ''::text NOT NULL,
    efin text DEFAULT ''::text NOT NULL,
    kpp text DEFAULT ''::text NOT NULL,
    client_documents jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by text DEFAULT 'local-dev'::text NOT NULL,
    updated_by text DEFAULT 'local-dev'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    invoice_default_service text,
    invoice_default_amount numeric(14,0) DEFAULT 0 NOT NULL,
    invoice_default_tax_mode text,
    invoice_default_tax_rate numeric(8,2) DEFAULT 2 NOT NULL
);


--
-- Name: cloud_activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cloud_activity_logs (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    actor_username text DEFAULT ''::text NOT NULL,
    actor_name text DEFAULT ''::text NOT NULL,
    actor_role text DEFAULT ''::text NOT NULL,
    module_id text DEFAULT ''::text NOT NULL,
    module_title text DEFAULT ''::text NOT NULL,
    action_key text DEFAULT ''::text NOT NULL,
    action_label text DEFAULT ''::text NOT NULL,
    entity_type text DEFAULT ''::text NOT NULL,
    entity_id text DEFAULT ''::text NOT NULL,
    entity_label text DEFAULT ''::text NOT NULL,
    client_name text DEFAULT ''::text NOT NULL,
    tax_year text DEFAULT ''::text NOT NULL,
    month_name text DEFAULT ''::text NOT NULL,
    tax_type text DEFAULT ''::text NOT NULL,
    status text DEFAULT ''::text NOT NULL,
    http_method text DEFAULT ''::text NOT NULL,
    route_path text DEFAULT ''::text NOT NULL,
    status_code integer DEFAULT 0 NOT NULL,
    duration_ms integer DEFAULT 0 NOT NULL,
    detail_summary text DEFAULT ''::text NOT NULL,
    request_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    response_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    ip_address text DEFAULT ''::text NOT NULL,
    user_agent text DEFAULT ''::text NOT NULL
);


--
-- Name: cloud_activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cloud_activity_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cloud_activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cloud_activity_logs_id_seq OWNED BY public.cloud_activity_logs.id;


--
-- Name: desktop_file_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.desktop_file_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_hash text NOT NULL,
    source_type text NOT NULL,
    record_id text NOT NULL,
    file_id text NOT NULL,
    file_name text NOT NULL,
    mime_type text,
    client_name text,
    tax_year text,
    source_label text,
    server_origin text,
    status text DEFAULT 'created'::text NOT NULL,
    created_by text,
    created_by_user_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    downloaded_at timestamp with time zone,
    uploaded_at timestamp with time zone,
    closed_at timestamp with time zone,
    last_heartbeat_at timestamp with time zone,
    last_error text,
    upload_count integer DEFAULT 0 NOT NULL,
    last_uploaded_size bigint,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: employee_database; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_database (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_name text NOT NULL,
    nama_karyawan text NOT NULL,
    nik text,
    alamat text,
    jabatan text,
    jenis_kelamin text NOT NULL,
    ptkp_status text NOT NULL,
    created_by text,
    updated_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: employee_ptkp_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_ptkp_statuses (
    code text NOT NULL,
    amount numeric(14,0) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    legacy_row_number integer,
    legacy_invoice_id text,
    jenis_dokumen text DEFAULT ''::text NOT NULL,
    jenis_invoice text DEFAULT ''::text NOT NULL,
    nomor_dokumen text DEFAULT ''::text NOT NULL,
    tanggal_dokumen date,
    bulan_pajak text DEFAULT ''::text NOT NULL,
    nama_klien text DEFAULT ''::text NOT NULL,
    client_id text DEFAULT ''::text NOT NULL,
    alamat text DEFAULT ''::text NOT NULL,
    npwp text DEFAULT ''::text NOT NULL,
    nik_pic text DEFAULT ''::text NOT NULL,
    mode_pph text DEFAULT ''::text NOT NULL,
    tarif_pph numeric(8,2) DEFAULT 0 NOT NULL,
    nilai_dasar numeric(14,0) DEFAULT 0 NOT NULL,
    jumlah_tagihan numeric(14,0) DEFAULT 0 NOT NULL,
    status_pembayaran text DEFAULT ''::text NOT NULL,
    tanggal_lunas date,
    payment_details jsonb,
    pdf_file_id text DEFAULT ''::text NOT NULL,
    pdf_file_url text DEFAULT ''::text NOT NULL,
    pdf_file_name text DEFAULT ''::text NOT NULL,
    folder_url text DEFAULT ''::text NOT NULL,
    created_by text DEFAULT 'local-dev'::text NOT NULL,
    updated_by text DEFAULT 'local-dev'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: kk_pph21_manual_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kk_pph21_manual_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_name text NOT NULL,
    tax_year text NOT NULL,
    month_name text NOT NULL,
    sub_tax_type text NOT NULL,
    entry_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by text,
    updated_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: office_attendance_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.office_attendance_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    attendance_date date NOT NULL,
    user_id uuid,
    employee_name text NOT NULL,
    username text,
    status text DEFAULT 'Hadir'::text NOT NULL,
    check_in_at timestamp with time zone DEFAULT now(),
    latitude numeric(12,9),
    longitude numeric(12,9),
    distance_meters numeric(12,2),
    location_status text DEFAULT 'Belum Dicek'::text NOT NULL,
    time_status text DEFAULT 'Tepat Waktu'::text NOT NULL,
    check_out_at timestamp with time zone,
    check_out_latitude numeric(12,9),
    check_out_longitude numeric(12,9),
    check_out_distance_meters numeric(12,2),
    check_out_location_status text,
    check_out_time_status text,
    check_out_token text,
    check_out_device_info text,
    check_out_notes text,
    token text,
    device_info text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: office_attendance_qr_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.office_attendance_qr_tokens (
    token text NOT NULL,
    attendance_date date NOT NULL,
    token_type text DEFAULT 'check_in'::text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: office_attendance_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.office_attendance_settings (
    id smallint DEFAULT 1 NOT NULL,
    office_name text DEFAULT 'PT X'::text NOT NULL,
    office_latitude numeric(12,9) DEFAULT '-7.035048335'::numeric NOT NULL,
    office_longitude numeric(12,9) DEFAULT 110.435497757 NOT NULL,
    radius_meters integer DEFAULT 100 NOT NULL,
    work_start time without time zone DEFAULT '08:00:00'::time without time zone NOT NULL,
    work_end time without time zone DEFAULT '17:00:00'::time without time zone NOT NULL,
    late_tolerance_minutes integer DEFAULT 60 NOT NULL,
    qr_required boolean DEFAULT true NOT NULL,
    token_expires_at time without time zone DEFAULT '09:30:00'::time without time zone NOT NULL,
    qr_email_enabled boolean DEFAULT false NOT NULL,
    qr_email_recipients text DEFAULT ''::text NOT NULL,
    qr_send_time time without time zone DEFAULT '07:30:00'::time without time zone NOT NULL,
    checkout_token_expires_at time without time zone DEFAULT '18:00:00'::time without time zone NOT NULL,
    checkout_qr_send_time time without time zone DEFAULT '16:30:00'::time without time zone NOT NULL,
    updated_by text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT office_attendance_settings_id_check CHECK ((id = 1))
);


--
-- Name: office_calendar_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.office_calendar_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    calendar_date date NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    type text DEFAULT 'Libur Manual'::text NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    source text DEFAULT 'Manual Cloud'::text NOT NULL,
    created_by text DEFAULT ''::text NOT NULL,
    updated_by text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pph21_progressive_brackets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pph21_progressive_brackets (
    code text NOT NULL,
    label text NOT NULL,
    lower_limit numeric(14,0) NOT NULL,
    upper_limit numeric(14,0),
    rate numeric(6,4) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: client_portal_activity_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_activity_log ALTER COLUMN id SET DEFAULT nextval('public.client_portal_activity_log_id_seq'::regclass);


--
-- Name: cloud_activity_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cloud_activity_logs ALTER COLUMN id SET DEFAULT nextval('public.cloud_activity_logs_id_seq'::regclass);


--
-- Data for Name: app_sheet_rows; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: app_sheet_sources; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: app_users; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: bre_cash_on_hold_settings; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: bre_ppn_masukan_overrides; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: bre_sheet_rows; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.client_portal_accounts VALUES ('e829474a-5407-400a-bab0-8dda97c73d87', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', 'pt-x-local', '', '', 'PT X', '', '', 'client', '', '', true, false, NULL, 'pt_x_local', 'pt_x_local', '2026-07-23 09:15:06.073812+07', '2026-10-12 07:31:49.203742+07');


--
-- Data for Name: client_portal_activity_log; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_aktiva_penyusutan_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_book_closing_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_buku_bank_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_buku_kas_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_buku_pembelian_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_buku_penjualan_dp_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_buku_penjualan_faktur_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_buku_penjualan_lengkap_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_buku_penjualan_pelunasan_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_buku_persediaan_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_coa_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.client_portal_coa_accounts VALUES ('47aa0392-ce9b-443e-8b49-9121a420cda3', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1821', 'AKM PENY KENDARAAN', 28, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('0d051c84-df1f-4ef5-ad62-a5c599c19d94', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2100', 'HUTANG DAGANG', 29, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('f5d71651-f649-493b-b107-98486cfb261a', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2200', 'UANG MUKA PENJUALAN', 31, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('ba2f69c9-7a7b-465c-92dd-37b0f0174dc0', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2300', 'HUTANG BIAYA', 32, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('45c97d2e-3fc2-45c8-9f0d-ecb44e0b1429', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2400', 'HUTANG LEASING', 34, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('c07f842f-6a52-4c85-bd72-9a3d1aea383e', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2502', 'HUTANG PPH 23', 37, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('a530d79b-78da-472f-a5d1-455669be1cc2', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2503', 'HUTANG PPH 25', 38, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('f60005fa-7269-4c98-bc2c-c5a3c9b1e831', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2504', 'HUTANG PPH 29', 39, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('dfc932ec-da21-4f02-b61a-6ec9f2398196', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2505', 'HUTANG PPN', 40, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('9aa69d96-88cf-4118-8a1d-b89e2976ed81', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '3100', 'MODAL SAHAM', 41, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('3f545800-b60b-4a02-9d9f-5371efd0779b', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '3200', 'DEVIDEN', 42, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('94325d2e-cfa9-4ac1-aeb2-365a4746b9d1', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '3400', 'LABA TAHUN BERJALAN', 44, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('c6033f3f-57f0-4daa-9d76-a5f00a692f4a', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '4100', 'PENJUALAN', 46, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('19d7e90f-9e32-41b9-b3b6-49d6505387ef', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '5101', 'PEMBELIAN PPN', 47, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('69eb4805-3ee6-4810-ba4f-5309307a0871', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '5102', 'PEMBELIAN NON PPN', 48, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('d2f8625c-93c0-45fe-8522-7b6547c47128', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '5103', 'PEMBELIAN BELUM TERIMA FAKTUR', 49, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('d150c23c-490a-4b0d-aaa2-278f622d94cc', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '5201', 'BIAYA PROYEK', 50, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('d76d4156-8e7d-4762-aa51-60eb354da365', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6101', 'BIAYA GAJI', 51, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('8aa354bf-263a-4c31-a56e-07406826ef04', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6102', 'BIAYA KANTOR', 52, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('edf4b349-25a2-4bb7-8bee-a907e39c207a', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6107', 'BIAYA KENDARAAN', 57, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('e885432e-a80a-4b90-a3e5-a3d8a2ac26f4', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6108', 'BIAYA KONSULTAN', 58, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('d57009b8-654e-444a-a9b3-7a3175ae0371', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6109', 'BIAYA SEWA GEDUNG', 59, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('e868e301-7ac9-4bc7-b318-449cbd0e71e7', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6110', 'BIAYA PENYUSUTAN', 60, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('9e040e27-bf31-42fa-a245-b21287c46d56', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6114', 'BY TRANSPORTASI', 64, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('dc01e878-8039-47dd-be18-9afb5f3e9e3e', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6115', 'BY EKPEDISI', 65, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('67323fae-5367-41a2-9b56-a9a16613b3e8', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6116', 'BY LISTRIK, TELP, AIR', 66, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('9344ebf9-daf5-418e-9cdd-fe33c230ef0f', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6118', 'BY PAJAK', 68, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('eccc4e1b-1be1-4ca7-b13b-dc78a9253136', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6121', 'PENDAPATAN JASA GIRO', 71, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('e15888b6-efc1-488e-88b9-b7823b72f28d', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6123', 'PENDAPATAN LAIN-LAIN', 73, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('da044229-d244-4a84-aa33-98eb6bd75276', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6124', 'PAJAK JASA GIRO', 74, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('a9c7f81f-53ba-4dfb-a1bf-20ab935a486d', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6126', 'BIAYA ADM BANK', 76, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('2949dad8-fa2d-468c-a63d-e18b0d8bb37b', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6127', 'BIAYA NON OPERASIONAL LAIN-LAIN', 77, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('e9fcf4f2-3557-4d40-ae9a-cd1e6d93a0ed', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6128', 'BIAYA KARTU KREDIT (PRIBADI OWNER)', 78, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('dcb8edf1-7f9b-4d95-8ac0-622b7d0cb2ed', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6129', 'BIAYA PAJAK TAHUN LALU', 79, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('27695d47-460a-41c6-a912-03b4b929e907', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6130', 'BIAYA MATERAI', 80, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('07189b2c-d2a0-4885-b53b-dea1c9f6449a', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6131', 'BIAYA PAJAK TAHUN BERJALAN', 81, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('e1c7ba92-7512-4d51-bd75-29c6cbfb5d74', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6132', 'BIAYA PAJAK TH BERJALAN', 82, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('c2d7e530-10ad-4776-a6a9-e7ff19e98d00', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1002', 'GAJI DEALER', 60, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('134d9517-1cb8-44f3-bde0-c07f40b49ba6', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-5002', 'PERSEDIAAN MOTOR KONDISIONAL', 24, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('6bdf46ff-7dfb-4fd8-8e17-4ecd8d39dc7f', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1010', 'BIAYA KANTOR', 68, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('315d842a-8598-47e9-8488-1a495f0d2cd6', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1011', 'BIAYA PERAWATAN D-PACK', 69, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('de4cb8bb-9ea3-4911-a691-905411b3cf61', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1012', 'BIAYA ACT PROMOSI', 70, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('22ca5e0e-b384-4293-8eab-443edf4f4f3c', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1601', 'PIUTANG DIREKSI', 11, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('d46d2b8a-1caf-4fb7-891f-15d2c7d25c3d', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '8-1001', 'PENDAPATAN BONUS', 87, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('7f38f88a-c228-45fd-9d83-cd14e2522ba6', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6112', 'BY BUNGA KREDIT', 62, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('c7735f9e-40e7-43a2-bd11-fd40c743ec22', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '3-1003', 'Pemilik Contoh', 45, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('b15701b6-46dd-4d59-9e7a-71c85af13a6d', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '3-2001', 'AKUMULASI LABA', 46, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('30855d33-2550-4760-a99b-984fb32dbdc6', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-3004', 'PDM 25', 7, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('67c1f6ff-cd8e-4ce2-bd4b-80b344fd59b3', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-3005', 'PPH PS 25 TH 2023', 8, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('a5accb65-f301-4031-bf78-257cbfc8eef3', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '5-1002', 'HPP SPAREPART', 58, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('8b1c4b2a-0b0e-4ab9-a80e-32867416cdf8', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-2007', 'BANK BCA 0000000002', 20, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('5f971aea-48ba-4d77-bbf9-18813be575d7', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6104', 'BY NOTARIS', 54, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('fbf2efba-71b8-4199-a573-24f95f0b3504', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1702', 'SEWA DIBAYAR DIMUKA', 14, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('2e950cb4-2082-4fe1-9c89-86e17de4c172', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-7001', 'AKM PENYUSUTAN', 30, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('2c8d5d88-5740-45cd-98f0-83447a31a160', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '4-1002', 'PENJUALAN SPAREPART', 53, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('3e48a48f-e267-4edc-82b6-171d2732d599', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '3-2002', 'SETORAN PEMILIK CONTOH', 47, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('d537650c-4bb4-4798-ba99-57961eb0d785', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '7-1007', 'PAJAK BUNGA BANK', 85, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('8e474339-4ff8-4d39-8bdb-38f9bce262b0', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '7-1008', 'BIAYA PAJAK TAHUN BERJALAN', 86, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('014aa3a7-42d8-4b62-9d9e-fb09d6e18b9b', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1019', 'BIAYA SEWA LARIS', 77, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('03fda921-34ff-4202-a314-5e29e6d2cb47', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6125', 'Penyesuaian Akumulasi Penyusutan', 75, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('de9508e8-d881-4ba4-bbb0-e0d2fabe9d58', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2-3003', 'HUTANG PPH 23', 38, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('e2a0fb87-5990-4bde-bb48-0f4efda1ff6a', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-2011', 'BCA OPERASIONAL', 91, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('9d177d9c-64c2-4ef1-bb5c-16fb9905e40b', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '7-1004', 'BIAYA PAJAK TH BERJALAN', 82, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('95ece1f9-b946-45e5-97c8-dd4ac47cf9b6', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '7-1006', 'BEBAN ADMINISTRASI BANK', 84, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('33d1057d-932f-404e-a1d7-eb6e860c9fd5', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6113', 'BY BPJS', 63, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('e9cab635-cfb9-4dd8-9261-ef9b5fca4a22', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6117', 'BY ASURANSI', 67, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('792665de-83e3-434e-b5a4-2f32da67c47e', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-5001', 'PERSEDIAAN MOTOR', 23, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('13ae6eed-be91-4d66-9854-9f7476700793', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1015', 'BIAYA ATK & METERAI', 73, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('8467928b-5818-44b5-ab7b-3996d581f82c', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1016', 'BIAYA LAIN-LAIN', 74, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('febc9b0b-be58-4cdf-bd25-2417807e1fc9', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1014', 'BIAYA TRANSPORT', 72, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('44ee8948-699e-4c73-a2c9-75adf86b0a05', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-4002', 'PIUTANG LAINNYA', 22, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('5d628c63-6042-4e7e-9a80-417c2e077dd6', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2-1001', 'HUTANG DAGANG', 32, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('107780f8-9565-4b7e-ba23-b3e480c73aee', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1708', 'PDM PPH 23', 20, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('b5f7d63d-fe4e-4e59-a014-86d230ef27ff', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-6001', 'AKTIVA TETAP', 26, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('5e2a241c-893a-4af1-bbd0-dffd999aa75b', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-2002', 'BANK BCA 0000000001', 15, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('8bc2692c-81b7-4095-89ec-6bf37b169c0f', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-2004', 'BANK BCA 0000000004', 17, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('a8f5fe4a-559e-4114-aca3-28bd52712965', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-2005', 'BANK MANDIRI', 18, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('de99f377-c019-4119-924d-9c74b81e1e54', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-2006', 'BANK JATENG', 19, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('03f026c0-1be5-451b-a4f6-084f24343d36', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1704', 'MTS PPN 2023', 16, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('00f21b41-6bc7-4d4f-a905-f0269b50fd88', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '7-1005', 'BIAYA SEWA', 83, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('2ba4cde2-58e4-42ca-afdb-6bd7534fe68b', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1100', 'KAS SETARA KAS', 1, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('e74caeb8-a81e-4ece-876d-0b7e06b315eb', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1201', 'BANK BCA 0000 000 000', 2, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('32ecccba-69c5-407e-824e-f42b7ebaa7a1', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1203', 'BANK Jateng 0000 000 000', 4, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('75b4bd02-e739-4445-9e83-8cc4fdae3f94', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1204', 'BANK Mandiri 000 00 0000000 0', 5, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('12592ee4-e34c-4dfd-b726-9a3adfacf754', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1205', 'BANK BCA OP', 6, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('48beec12-a789-4eaf-abab-a001bac78f43', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1206', 'BANK BTN', 7, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('d87c7314-57c5-40a9-83a2-dae20975e661', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1602', 'PIUTANG DAGANG', 12, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('2e3b6d67-3b9c-4fd5-bc6a-c079d1b25eca', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1701', 'UANG MUKA PEMBELIAN', 13, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('fddfa618-b535-4c1c-87b8-f745e0b48ef3', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1706', 'PPN DIBAYAR DIMUKA', 18, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('546d0ae6-ec06-457d-89f6-0c51ba5b909a', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1707', 'PDM PPH 22', 19, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('0478baa1-3475-48bd-b425-cf8c1b03832d', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1810', 'INVENTARIS KANTOR', 25, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('5f6e45ae-a489-4050-9d90-6eaec8e723cc', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1811', 'AKM PENYUSUTAN INV KANTOR', 26, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('eb8f0dfc-ceda-4f62-b480-5af349dbd627', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1820', 'KENDARAAN', 27, true, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.194522+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('faf517f1-19f4-4e11-a08d-d6f6285f744a', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '3-1002', 'Pak Agung', 44, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('e004cef4-3fa4-4727-89ec-bd9bd901f4c5', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-6004', 'INVENTARIS KANTOR', 29, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('57cfddd7-ac50-4d5f-8aaa-3cf977f579c2', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2-2001', 'HUTANG BIAYA', 34, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('15a312c4-32bb-4619-845d-f2f2e65ab910', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '7-1001', 'BIAYA BONUS', 79, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('077beabf-1608-4ed2-9a15-36ec09c9a2b4', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1007', 'BIAYA TELEPON & INTERNET BENGKEL', 65, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('feff1ca4-a8f6-4d25-8553-c8ba29b1077d', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '9-1001', 'AYAT SILANG', 51, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('f770c218-42a2-4492-a0d6-d4d1581f86b8', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2-3004', 'HUTANG PPH 25', 39, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('d2e9c984-e518-4eaa-851b-5be456c931e0', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6120', 'BEBAN IKLAN', 70, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('a1273aa9-80a6-49d5-98d0-ba970b4b0e94', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6122', 'BUNGA OBLIGASI', 72, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('28326222-a73f-418e-86b7-0825db38beae', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1001', 'BIAYA PENYUSUTAN', 59, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('aed2c533-76b3-4faa-b36d-b792fc721715', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2501', 'HUTANG PPH 21', 36, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('950b49cc-1981-485a-8abc-fb09676e988e', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2-3001', 'HUTANG PPN', 36, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('77f95e63-ac80-4770-b369-a0c8cf6e259b', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2-3002', 'HUTANG PPH 22', 37, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('70929e54-00fd-4396-b875-b9c0bd3c082f', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1005', 'BIAYA LISTRIK AIR BENGKEL', 63, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('0f6aa04d-bee5-4624-ab5e-edde4aebf850', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2101', 'HUTANG DAGANG KHUSUS', 30, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('15a0ffdb-de5d-41cf-8e6a-32e89f71f7a0', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-3001', 'PAJAK DIBAYAR DIMUKA', 4, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('70ec01d3-6b7c-4dc7-9622-f071aa6c0bb3', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1009', 'BIAYA KONSULTAN', 67, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('510153c2-c2f4-48c5-92cc-c6b4c522125c', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '5-1001', 'HPP MOTOR', 57, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('5b422db5-ddc2-4a8c-b968-44322d0fe92d', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1300', 'OBLIGASI', 8, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('b8292e6d-6239-4f79-a8ab-81d6ffdc13d7', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2301', 'HUTANG SEWA', 33, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('701364b6-5ddd-4ea4-950f-b7fac8c28294', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2401', 'UANG JAMINAN', 35, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('7b921d77-b52e-4e81-a1ff-9b32f4876e83', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '7-1003', 'BIAYA PAJAK', 81, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('d375d514-85fa-4cc6-97c0-bbfe36a194c6', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '3999', 'AYAT SILANG', 45, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('2a9fa449-cdab-4f76-b4b2-99e4e20eeb01', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1202', 'BANK BRI', 3, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('5fc3c0ee-6cda-4065-aa14-f1527602d458', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-1001', 'KAS', 1, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('e6035cdf-06b3-43a9-93f8-0ed74e6c53b2', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '4-1004', 'PENDAPATAN JASA PERANTARA', 55, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('43610ebe-315e-4f7e-a0da-4b877331d1c6', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '4-1005', 'PENDAPATAN BONUS', 56, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('e315f6b7-8966-4bd1-86ad-92457a4b2595', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1004', 'BIAYA LISTRIK AIR DEALER', 62, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('050f159f-36cb-46ab-9866-02579c9bccc8', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-6003', 'BANGUNAN', 28, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('8d7e786f-cf21-4319-a349-19039a366465', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-3006', 'PPH PS 25 TH 2024', 9, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('9e6166bb-1abf-487b-a4be-12c20e4436c5', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-3007', 'PPH PS 22 TH 2024', 10, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('c3d91b07-8273-4551-ab32-4d2847d51a46', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-3008', 'PPH PS 22 TH 2025', 11, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('d9422e7a-993b-496a-9150-b2a60424e30b', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-3009', 'PPH PS 23 TH 2025', 12, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('a648f5a3-9c5f-42fd-af7c-c4dcde4de403', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1008', 'BIAYA JAKET, KAOS, TAS, STICKER', 66, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('acf85e34-5a9f-4bcb-abe0-bcb4fdace831', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '4-1001', 'PENJUALAN MOTOR', 52, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('eea912d5-7140-41f2-9092-ebfce9530321', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-5003', 'PERSEDIAAN SPAREPART', 25, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('d7d93873-6b91-4590-8e59-351167dc8175', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-4001', 'PIUTANG DAGANG', 21, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('843f84a3-e76a-4b77-9ad7-3bb6570cbcbb', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1400', 'ASET LANCAR LAIN-LAIN', 9, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('9299a2b8-011b-4599-bb3c-571dc435ad0e', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2-3005', 'HUTANG PPH 29', 40, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('84df43c5-ea87-4f56-bfb1-6b3c7993b2b9', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2-1002', 'HUTANG SPAREPART', 33, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('3d03ca22-fd84-489c-8b29-a1a1cb17cec3', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-2010', 'BANK BTN', 90, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('a8658a55-467a-4636-bb28-34d71c149d7c', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6106', 'BY PPH 25', 56, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('4347aea4-cf84-4941-add9-cbfb57fac7db', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6111', 'BY SUMBANGAN', 61, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('d4242ff9-15d8-4a65-81e2-a940795706dc', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2-3006', 'HUTANG PPH 4(2)', 41, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('b56eebbf-04e0-4582-9653-b75d07a93520', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2-3007', 'HUTANG PPH 21', 42, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('cb779f34-d646-425f-99d9-86b74cf746c1', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6105', 'BY PPH 22', 55, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('563fd3d3-ac4d-4d95-8068-35bcc9571855', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1705', 'PPN SEDANG DIRESTITUSI', 17, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('7b425de1-b283-438e-b337-96d766169b54', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1712', 'PDM PPH 25 th 2021', 24, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('19b68f1e-0638-4e80-a221-f7cc008c1629', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-3010', 'PPH PS 25 TH 2025', 13, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('54c0a5e8-237c-413f-b1a3-ac806c743672', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-2003', 'BANK BCA 0000000003', 16, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('5d365d59-4f90-452b-954e-39eed8e466f9', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6103', 'BIAYA METERAI', 53, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('17872d90-8c7f-40e5-965d-2a086f03f29f', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '8-1002', 'PENDAPATAN JASA GIRO', 88, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('95f78666-966e-425a-9af4-1200a2d2ea1a', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '8-1003', 'PENDAPATAN LAINNYA', 89, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('b574e348-95ea-4ff3-bec4-1d1d1d9f0968', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '4-1003', 'PENDAPATAN JASA SERVIS', 54, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('0168d026-f770-4da6-8f16-aac02c16af6b', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1017', 'BIAYA BBN UNOTICE', 75, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('c00404e7-b967-4e26-96e5-c38780938af5', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1709', 'PDM PPH 25', 21, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('de8da193-1eaa-462b-ad45-148e4ad36aa1', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1710', 'PDM PPH 22 th 2021', 22, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('bd312069-7bb9-42ae-9748-682daea8753f', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1711', 'PDM PPH 22 th 2022', 23, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('ba3a83f1-6028-4c4f-8c1b-57ff4878abed', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '3-1001', 'MODAL', 43, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('30447244-6b29-4ecc-b759-33c6ba093312', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1020', 'BIAYA POS', 78, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('9a211248-37e5-4fa1-9800-8c6363610fb7', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1500', 'PERSEDIAAN', 10, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('22846b0c-b510-42c3-b691-5f1d6d4d51c4', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1013', 'BIAYA PERAWATAN', 71, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('5618087a-2177-433c-acc4-51f7be9c7e2a', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1018', 'BIAYA GOV CHARGE', 76, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('b566199c-ff1a-45f7-990d-e6fcaca9e980', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '3-2005', 'LABA TH BERJALAN', 50, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('be1d1a2b-4b92-4e20-b4f9-230f04b703ad', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '3-2004', 'LABA DITAHAN EX TA', 49, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('1e867911-987d-43ae-b1d8-831ec36744d8', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '2-2002', 'HUTANG BBN', 35, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('3d760dbe-7050-4a56-89f8-0ec6a719065c', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-6002', 'KENDARAAN', 27, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('700e99db-07e2-47e8-a3fc-0b1326c7422d', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1006', 'BIAYA TELEPON & INTERNET DEALER', 64, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('d95adce5-5aae-4c40-92a8-0f3943085717', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-7002', 'AKTIVA LAIN-LAIN', 31, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('3e563835-9553-4d0b-b566-9da1cb1801bd', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-1002', 'KAS BBN UNOTICE', 2, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('048925a2-685d-4d84-9a75-9774a9324122', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-2001', 'BANK PEMILIK CONTOH', 14, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('1f877f79-3f08-4215-9253-89a8f39ca860', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '3-2003', 'PRIVE', 48, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('caa73d36-ff21-4ce6-a7b5-b7877b123ae5', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '7-1002', 'BIAYA PAJAK TAHUN SEBELUMNYA', 80, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('73457bab-0717-4c8d-9abb-9c411f82fcff', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '3300', 'LABA DITAHAN', 43, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('8c14f5d1-2bd5-401e-9754-1098791fd4cc', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6119', 'BY LAIN-LAIN', 69, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('887f2481-6ebb-4421-a5f9-3d3ede30938b', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-1003', 'KAS 2', 3, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('7fe88400-d512-4538-ae24-1bb0d81819e4', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1703', 'PAJAK DIBAYAR DIMUKA', 15, false, '2026-07-27 11:05:49.213123+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('a4df2e9f-b465-40f1-bfa0-ffc8e22cf1a0', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-3002', 'PDM 22', 5, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('b3f52cc6-796e-4b72-a000-2193c9106afc', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '1-3003', 'PDM 23', 6, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');
INSERT INTO public.client_portal_coa_accounts VALUES ('6c7a064b-95f3-4ce7-a084-4e6ff5c9a8e0', '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', '6-1003', 'GAJI BENGKEL', 61, false, '2026-07-24 14:40:21.767218+07', '2026-10-12 07:49:11.200967+07');


--
-- Data for Name: client_portal_data_migrations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_document_sequences; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_fiscal_correction_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_hti_advance_allocations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_hti_advance_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_hti_bank_interest_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_hti_customer_master; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_hti_expense_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_hti_project_controls; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_hti_purchase_fp_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_hti_purchase_non_ppn_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_hti_sales_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_hti_supplier_master; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_jurnal_adjustment_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_mobile_upload_sessions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_neraca_lajur_opening_balances; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_period_postings; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_po_customer_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_tbb_fish_master; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_tbb_purchase_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_tbb_sales_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_tbb_settlement_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: client_portal_tbb_supplier_master; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.clients VALUES ('6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7', NULL, 'Badan', 'PT X', '', '', '', '', '', '', '', '', '', '', '', '{}', 'pt_x_local', 'pt_x_local', '2026-07-23 09:15:06.073812+07', '2026-10-12 07:31:49.203742+07', NULL, 0, NULL, 2.00);


--
-- Data for Name: cloud_activity_logs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: desktop_file_sessions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: employee_database; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: employee_ptkp_statuses; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.employee_ptkp_statuses VALUES ('TK/0', 54000000, 1, '2026-10-12 07:31:50.539448+07');
INSERT INTO public.employee_ptkp_statuses VALUES ('TK/1', 58500000, 2, '2026-10-12 07:31:50.539448+07');
INSERT INTO public.employee_ptkp_statuses VALUES ('TK/2', 63000000, 3, '2026-10-12 07:31:50.539448+07');
INSERT INTO public.employee_ptkp_statuses VALUES ('TK/3', 67500000, 4, '2026-10-12 07:31:50.539448+07');
INSERT INTO public.employee_ptkp_statuses VALUES ('K/0', 58500000, 5, '2026-10-12 07:31:50.539448+07');
INSERT INTO public.employee_ptkp_statuses VALUES ('K/1', 63000000, 6, '2026-10-12 07:31:50.539448+07');
INSERT INTO public.employee_ptkp_statuses VALUES ('K/2', 67500000, 7, '2026-10-12 07:31:50.539448+07');
INSERT INTO public.employee_ptkp_statuses VALUES ('K/3', 72000000, 8, '2026-10-12 07:31:50.539448+07');


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: kk_pph21_manual_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: office_attendance_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: office_attendance_qr_tokens; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: office_attendance_settings; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: office_calendar_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: pph21_progressive_brackets; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.pph21_progressive_brackets VALUES ('L1', '0-60.000.000', 0, 60000000, 0.0500, 1, '2026-10-12 07:31:50.549564+07');
INSERT INTO public.pph21_progressive_brackets VALUES ('L2', '60.000.000-250.000.000', 60000000, 250000000, 0.1500, 2, '2026-10-12 07:31:50.549564+07');
INSERT INTO public.pph21_progressive_brackets VALUES ('L3', '250.000.000-500.000.000', 250000000, 500000000, 0.2500, 3, '2026-10-12 07:31:50.549564+07');
INSERT INTO public.pph21_progressive_brackets VALUES ('L4', '500.000.000-5.000.000.000', 500000000, 5000000000, 0.3000, 4, '2026-10-12 07:31:50.549564+07');
INSERT INTO public.pph21_progressive_brackets VALUES ('L5', '>5.000.000.000', 5000000000, NULL, 0.3500, 5, '2026-10-12 07:31:50.549564+07');


--
-- Name: client_portal_activity_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.client_portal_activity_log_id_seq', 3, true);


--
-- Name: cloud_activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cloud_activity_logs_id_seq', 1, false);


--
-- Name: app_sheet_rows app_sheet_rows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_sheet_rows
    ADD CONSTRAINT app_sheet_rows_pkey PRIMARY KEY (source_key, sheet_name, row_number);


--
-- Name: app_sheet_sources app_sheet_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_sheet_sources
    ADD CONSTRAINT app_sheet_sources_pkey PRIMARY KEY (source_key);


--
-- Name: app_users app_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_users
    ADD CONSTRAINT app_users_pkey PRIMARY KEY (id);


--
-- Name: app_users app_users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_users
    ADD CONSTRAINT app_users_username_key UNIQUE (username);


--
-- Name: bre_cash_on_hold_settings bre_cash_on_hold_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bre_cash_on_hold_settings
    ADD CONSTRAINT bre_cash_on_hold_settings_pkey PRIMARY KEY (setting_key);


--
-- Name: bre_ppn_masukan_overrides bre_ppn_masukan_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bre_ppn_masukan_overrides
    ADD CONSTRAINT bre_ppn_masukan_overrides_pkey PRIMARY KEY (source_module, source_row_number);


--
-- Name: bre_sheet_rows bre_sheet_rows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bre_sheet_rows
    ADD CONSTRAINT bre_sheet_rows_pkey PRIMARY KEY (module, legacy_row_number);


--
-- Name: client_portal_accounts client_portal_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_accounts
    ADD CONSTRAINT client_portal_accounts_pkey PRIMARY KEY (id);


--
-- Name: client_portal_accounts client_portal_accounts_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_accounts
    ADD CONSTRAINT client_portal_accounts_username_key UNIQUE (username);


--
-- Name: client_portal_activity_log client_portal_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_activity_log
    ADD CONSTRAINT client_portal_activity_log_pkey PRIMARY KEY (id);


--
-- Name: client_portal_aktiva_penyusutan_entries client_portal_aktiva_penyusutan_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_aktiva_penyusutan_entries
    ADD CONSTRAINT client_portal_aktiva_penyusutan_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_book_closing_entries client_portal_book_closing_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_book_closing_entries
    ADD CONSTRAINT client_portal_book_closing_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_buku_bank_entries client_portal_buku_bank_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_buku_bank_entries
    ADD CONSTRAINT client_portal_buku_bank_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_buku_kas_entries client_portal_buku_kas_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_buku_kas_entries
    ADD CONSTRAINT client_portal_buku_kas_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_buku_pembelian_entries client_portal_buku_pembelian_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_buku_pembelian_entries
    ADD CONSTRAINT client_portal_buku_pembelian_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_buku_penjualan_dp_entries client_portal_buku_penjualan_dp_entrie_client_id_receipt_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_buku_penjualan_dp_entries
    ADD CONSTRAINT client_portal_buku_penjualan_dp_entrie_client_id_receipt_no_key UNIQUE (client_id, receipt_no);


--
-- Name: client_portal_buku_penjualan_dp_entries client_portal_buku_penjualan_dp_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_buku_penjualan_dp_entries
    ADD CONSTRAINT client_portal_buku_penjualan_dp_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_buku_penjualan_faktur_entries client_portal_buku_penjualan_faktur_e_client_id_dp_entry_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_buku_penjualan_faktur_entries
    ADD CONSTRAINT client_portal_buku_penjualan_faktur_e_client_id_dp_entry_id_key UNIQUE (client_id, dp_entry_id);


--
-- Name: client_portal_buku_penjualan_faktur_entries client_portal_buku_penjualan_faktur_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_buku_penjualan_faktur_entries
    ADD CONSTRAINT client_portal_buku_penjualan_faktur_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_buku_penjualan_lengkap_entries client_portal_buku_penjualan_lengkap_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_buku_penjualan_lengkap_entries
    ADD CONSTRAINT client_portal_buku_penjualan_lengkap_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_buku_penjualan_pelunasan_entries client_portal_buku_penjualan_pelunasan_client_id_invoice_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_buku_penjualan_pelunasan_entries
    ADD CONSTRAINT client_portal_buku_penjualan_pelunasan_client_id_invoice_no_key UNIQUE (client_id, invoice_no);


--
-- Name: client_portal_buku_penjualan_pelunasan_entries client_portal_buku_penjualan_pelunasan_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_buku_penjualan_pelunasan_entries
    ADD CONSTRAINT client_portal_buku_penjualan_pelunasan_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_buku_persediaan_entries client_portal_buku_persediaan__client_id_source_purchase_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_buku_persediaan_entries
    ADD CONSTRAINT client_portal_buku_persediaan__client_id_source_purchase_id_key UNIQUE (client_id, source_purchase_id);


--
-- Name: client_portal_buku_persediaan_entries client_portal_buku_persediaan_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_buku_persediaan_entries
    ADD CONSTRAINT client_portal_buku_persediaan_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_coa_accounts client_portal_coa_accounts_client_id_coa_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_coa_accounts
    ADD CONSTRAINT client_portal_coa_accounts_client_id_coa_code_key UNIQUE (client_id, coa_code);


--
-- Name: client_portal_coa_accounts client_portal_coa_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_coa_accounts
    ADD CONSTRAINT client_portal_coa_accounts_pkey PRIMARY KEY (id);


--
-- Name: client_portal_data_migrations client_portal_data_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_data_migrations
    ADD CONSTRAINT client_portal_data_migrations_pkey PRIMARY KEY (migration_id, client_id);


--
-- Name: client_portal_document_sequences client_portal_document_sequen_client_id_document_key_period_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_document_sequences
    ADD CONSTRAINT client_portal_document_sequen_client_id_document_key_period_key UNIQUE (client_id, document_key, period_key);


--
-- Name: client_portal_document_sequences client_portal_document_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_document_sequences
    ADD CONSTRAINT client_portal_document_sequences_pkey PRIMARY KEY (id);


--
-- Name: client_portal_fiscal_correction_entries client_portal_fiscal_correction_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_fiscal_correction_entries
    ADD CONSTRAINT client_portal_fiscal_correction_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_hti_advance_allocations client_portal_hti_advance_all_advance_id_source_table_sourc_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_hti_advance_allocations
    ADD CONSTRAINT client_portal_hti_advance_all_advance_id_source_table_sourc_key UNIQUE (advance_id, source_table, source_entry_id, payment_index);


--
-- Name: client_portal_hti_advance_allocations client_portal_hti_advance_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_hti_advance_allocations
    ADD CONSTRAINT client_portal_hti_advance_allocations_pkey PRIMARY KEY (id);


--
-- Name: client_portal_hti_advance_entries client_portal_hti_advance_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_hti_advance_entries
    ADD CONSTRAINT client_portal_hti_advance_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_hti_bank_interest_entries client_portal_hti_bank_interest_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_hti_bank_interest_entries
    ADD CONSTRAINT client_portal_hti_bank_interest_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_hti_customer_master client_portal_hti_customer_master_client_id_customer_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_hti_customer_master
    ADD CONSTRAINT client_portal_hti_customer_master_client_id_customer_code_key UNIQUE (client_id, customer_code);


--
-- Name: client_portal_hti_customer_master client_portal_hti_customer_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_hti_customer_master
    ADD CONSTRAINT client_portal_hti_customer_master_pkey PRIMARY KEY (id);


--
-- Name: client_portal_hti_expense_entries client_portal_hti_expense_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_hti_expense_entries
    ADD CONSTRAINT client_portal_hti_expense_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_hti_project_controls client_portal_hti_project_controls_client_id_project_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_hti_project_controls
    ADD CONSTRAINT client_portal_hti_project_controls_client_id_project_no_key UNIQUE (client_id, project_no);


--
-- Name: client_portal_hti_project_controls client_portal_hti_project_controls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_hti_project_controls
    ADD CONSTRAINT client_portal_hti_project_controls_pkey PRIMARY KEY (id);


--
-- Name: client_portal_hti_purchase_fp_entries client_portal_hti_purchase_fp_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_hti_purchase_fp_entries
    ADD CONSTRAINT client_portal_hti_purchase_fp_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_hti_purchase_non_ppn_entries client_portal_hti_purchase_non_ppn_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_hti_purchase_non_ppn_entries
    ADD CONSTRAINT client_portal_hti_purchase_non_ppn_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_hti_sales_entries client_portal_hti_sales_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_hti_sales_entries
    ADD CONSTRAINT client_portal_hti_sales_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_hti_supplier_master client_portal_hti_supplier_master_client_id_supplier_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_hti_supplier_master
    ADD CONSTRAINT client_portal_hti_supplier_master_client_id_supplier_code_key UNIQUE (client_id, supplier_code);


--
-- Name: client_portal_hti_supplier_master client_portal_hti_supplier_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_hti_supplier_master
    ADD CONSTRAINT client_portal_hti_supplier_master_pkey PRIMARY KEY (id);


--
-- Name: client_portal_jurnal_adjustment_entries client_portal_jurnal_adjustment_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_jurnal_adjustment_entries
    ADD CONSTRAINT client_portal_jurnal_adjustment_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_mobile_upload_sessions client_portal_mobile_upload_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_mobile_upload_sessions
    ADD CONSTRAINT client_portal_mobile_upload_sessions_pkey PRIMARY KEY (token);


--
-- Name: client_portal_neraca_lajur_opening_balances client_portal_neraca_lajur_opening_balan_client_id_coa_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_neraca_lajur_opening_balances
    ADD CONSTRAINT client_portal_neraca_lajur_opening_balan_client_id_coa_code_key UNIQUE (client_id, coa_code);


--
-- Name: client_portal_neraca_lajur_opening_balances client_portal_neraca_lajur_opening_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_neraca_lajur_opening_balances
    ADD CONSTRAINT client_portal_neraca_lajur_opening_balances_pkey PRIMARY KEY (id);


--
-- Name: client_portal_period_postings client_portal_period_postings_client_id_period_year_period__key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_period_postings
    ADD CONSTRAINT client_portal_period_postings_client_id_period_year_period__key UNIQUE (client_id, period_year, period_month);


--
-- Name: client_portal_period_postings client_portal_period_postings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_period_postings
    ADD CONSTRAINT client_portal_period_postings_pkey PRIMARY KEY (id);


--
-- Name: client_portal_po_customer_entries client_portal_po_customer_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_po_customer_entries
    ADD CONSTRAINT client_portal_po_customer_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_tbb_fish_master client_portal_tbb_fish_master_client_id_fish_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_tbb_fish_master
    ADD CONSTRAINT client_portal_tbb_fish_master_client_id_fish_code_key UNIQUE (client_id, fish_code);


--
-- Name: client_portal_tbb_fish_master client_portal_tbb_fish_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_tbb_fish_master
    ADD CONSTRAINT client_portal_tbb_fish_master_pkey PRIMARY KEY (id);


--
-- Name: client_portal_tbb_purchase_entries client_portal_tbb_purchase_entries_client_id_document_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_tbb_purchase_entries
    ADD CONSTRAINT client_portal_tbb_purchase_entries_client_id_document_no_key UNIQUE (client_id, document_no);


--
-- Name: client_portal_tbb_purchase_entries client_portal_tbb_purchase_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_tbb_purchase_entries
    ADD CONSTRAINT client_portal_tbb_purchase_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_tbb_sales_entries client_portal_tbb_sales_entries_client_id_invoice_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_tbb_sales_entries
    ADD CONSTRAINT client_portal_tbb_sales_entries_client_id_invoice_no_key UNIQUE (client_id, invoice_no);


--
-- Name: client_portal_tbb_sales_entries client_portal_tbb_sales_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_tbb_sales_entries
    ADD CONSTRAINT client_portal_tbb_sales_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_tbb_settlement_entries client_portal_tbb_settlement_entries_client_id_document_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_tbb_settlement_entries
    ADD CONSTRAINT client_portal_tbb_settlement_entries_client_id_document_no_key UNIQUE (client_id, document_no);


--
-- Name: client_portal_tbb_settlement_entries client_portal_tbb_settlement_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_tbb_settlement_entries
    ADD CONSTRAINT client_portal_tbb_settlement_entries_pkey PRIMARY KEY (id);


--
-- Name: client_portal_tbb_supplier_master client_portal_tbb_supplier_master_client_id_supplier_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_tbb_supplier_master
    ADD CONSTRAINT client_portal_tbb_supplier_master_client_id_supplier_code_key UNIQUE (client_id, supplier_code);


--
-- Name: client_portal_tbb_supplier_master client_portal_tbb_supplier_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_tbb_supplier_master
    ADD CONSTRAINT client_portal_tbb_supplier_master_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: cloud_activity_logs cloud_activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cloud_activity_logs
    ADD CONSTRAINT cloud_activity_logs_pkey PRIMARY KEY (id);


--
-- Name: desktop_file_sessions desktop_file_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desktop_file_sessions
    ADD CONSTRAINT desktop_file_sessions_pkey PRIMARY KEY (id);


--
-- Name: desktop_file_sessions desktop_file_sessions_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desktop_file_sessions
    ADD CONSTRAINT desktop_file_sessions_token_hash_key UNIQUE (token_hash);


--
-- Name: employee_database employee_database_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_database
    ADD CONSTRAINT employee_database_pkey PRIMARY KEY (id);


--
-- Name: employee_ptkp_statuses employee_ptkp_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_ptkp_statuses
    ADD CONSTRAINT employee_ptkp_statuses_pkey PRIMARY KEY (code);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: kk_pph21_manual_entries kk_pph21_manual_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kk_pph21_manual_entries
    ADD CONSTRAINT kk_pph21_manual_entries_pkey PRIMARY KEY (id);


--
-- Name: office_attendance_entries office_attendance_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_attendance_entries
    ADD CONSTRAINT office_attendance_entries_pkey PRIMARY KEY (id);


--
-- Name: office_attendance_qr_tokens office_attendance_qr_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_attendance_qr_tokens
    ADD CONSTRAINT office_attendance_qr_tokens_pkey PRIMARY KEY (token);


--
-- Name: office_attendance_settings office_attendance_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_attendance_settings
    ADD CONSTRAINT office_attendance_settings_pkey PRIMARY KEY (id);


--
-- Name: office_calendar_entries office_calendar_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_calendar_entries
    ADD CONSTRAINT office_calendar_entries_pkey PRIMARY KEY (id);


--
-- Name: pph21_progressive_brackets pph21_progressive_brackets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pph21_progressive_brackets
    ADD CONSTRAINT pph21_progressive_brackets_pkey PRIMARY KEY (code);


--
-- Name: client_portal_accounts_client_entity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_accounts_client_entity_idx ON public.client_portal_accounts USING btree (client_id, business_entity_key);


--
-- Name: client_portal_accounts_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_accounts_client_idx ON public.client_portal_accounts USING btree (client_id);


--
-- Name: client_portal_accounts_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_accounts_email_idx ON public.client_portal_accounts USING btree (lower(email));


--
-- Name: client_portal_activity_account_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_activity_account_idx ON public.client_portal_activity_log USING btree (account_id, created_at DESC);


--
-- Name: client_portal_activity_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_activity_client_idx ON public.client_portal_activity_log USING btree (client_id, created_at DESC);


--
-- Name: client_portal_aktiva_penyusutan_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_aktiva_penyusutan_client_idx ON public.client_portal_aktiva_penyusutan_entries USING btree (client_id, acquisition_date, created_at, id);


--
-- Name: client_portal_book_closing_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_book_closing_client_idx ON public.client_portal_book_closing_entries USING btree (client_id, period_year, period_month, created_at, id);


--
-- Name: client_portal_buku_bank_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_buku_bank_client_idx ON public.client_portal_buku_bank_entries USING btree (client_id, bank_key, entry_date, created_at, id);


--
-- Name: client_portal_buku_bank_mirror_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_buku_bank_mirror_idx ON public.client_portal_buku_bank_entries USING btree (client_id, mirror_source_table, mirror_source_id);


--
-- Name: client_portal_buku_kas_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_buku_kas_client_idx ON public.client_portal_buku_kas_entries USING btree (client_id, cash_book_key, entry_date, created_at, id);


--
-- Name: client_portal_buku_kas_mirror_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_buku_kas_mirror_idx ON public.client_portal_buku_kas_entries USING btree (client_id, mirror_source_table, mirror_source_id);


--
-- Name: client_portal_buku_pembelian_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_buku_pembelian_client_idx ON public.client_portal_buku_pembelian_entries USING btree (client_id, invoice_date, created_at, id);


--
-- Name: client_portal_buku_pembelian_frame_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX client_portal_buku_pembelian_frame_unique_idx ON public.client_portal_buku_pembelian_entries USING btree (client_id, upper(frame_no)) WHERE (frame_no <> ''::text);


--
-- Name: client_portal_buku_penjualan_dp_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_buku_penjualan_dp_client_idx ON public.client_portal_buku_penjualan_dp_entries USING btree (client_id, entry_date, created_at, id);


--
-- Name: client_portal_buku_penjualan_dp_frame_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_buku_penjualan_dp_frame_idx ON public.client_portal_buku_penjualan_dp_entries USING btree (client_id, upper(frame_no)) WHERE (frame_no <> ''::text);


--
-- Name: client_portal_buku_penjualan_faktur_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_buku_penjualan_faktur_client_idx ON public.client_portal_buku_penjualan_faktur_entries USING btree (client_id, faktur_date, created_at, id);


--
-- Name: client_portal_buku_penjualan_lengkap_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_buku_penjualan_lengkap_client_idx ON public.client_portal_buku_penjualan_lengkap_entries USING btree (client_id, entry_date, created_at, id);


--
-- Name: client_portal_buku_penjualan_lengkap_frame_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_buku_penjualan_lengkap_frame_idx ON public.client_portal_buku_penjualan_lengkap_entries USING btree (client_id, upper(frame_no)) WHERE (frame_no <> ''::text);


--
-- Name: client_portal_buku_penjualan_pelunasan_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_buku_penjualan_pelunasan_client_idx ON public.client_portal_buku_penjualan_pelunasan_entries USING btree (client_id, invoice_date, created_at, id);


--
-- Name: client_portal_buku_penjualan_pelunasan_complete_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_buku_penjualan_pelunasan_complete_idx ON public.client_portal_buku_penjualan_pelunasan_entries USING btree (client_id, complete_entry_id);


--
-- Name: client_portal_buku_persediaan_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_buku_persediaan_client_idx ON public.client_portal_buku_persediaan_entries USING btree (client_id, stock_date, created_at, id);


--
-- Name: client_portal_buku_persediaan_frame_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_buku_persediaan_frame_idx ON public.client_portal_buku_persediaan_entries USING btree (client_id, upper(frame_no));


--
-- Name: client_portal_coa_accounts_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_coa_accounts_client_idx ON public.client_portal_coa_accounts USING btree (client_id, sort_order, coa_code);


--
-- Name: client_portal_document_sequences_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_document_sequences_client_idx ON public.client_portal_document_sequences USING btree (client_id, document_key, period_key);


--
-- Name: client_portal_fiscal_correction_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_fiscal_correction_client_idx ON public.client_portal_fiscal_correction_entries USING btree (client_id, period_year, created_at, id);


--
-- Name: client_portal_hti_advance_alloc_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_hti_advance_alloc_idx ON public.client_portal_hti_advance_allocations USING btree (client_id, advance_id, allocation_date);


--
-- Name: client_portal_hti_advance_bank_entry_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX client_portal_hti_advance_bank_entry_idx ON public.client_portal_hti_advance_entries USING btree (client_id, bank_entry_id) WHERE (bank_entry_id <> ''::text);


--
-- Name: client_portal_hti_advance_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_hti_advance_idx ON public.client_portal_hti_advance_entries USING btree (client_id, bank_key, entry_date, status, id);


--
-- Name: client_portal_hti_bank_interest_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_hti_bank_interest_client_idx ON public.client_portal_hti_bank_interest_entries USING btree (client_id, entry_date DESC, created_at DESC, id);


--
-- Name: client_portal_hti_customer_master_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_hti_customer_master_client_idx ON public.client_portal_hti_customer_master USING btree (client_id, customer_code);


--
-- Name: client_portal_hti_expense_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_hti_expense_client_idx ON public.client_portal_hti_expense_entries USING btree (client_id, entry_date DESC, created_at DESC, id);


--
-- Name: client_portal_hti_expense_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_hti_expense_project_idx ON public.client_portal_hti_expense_entries USING btree (client_id, project_no, expense_type);


--
-- Name: client_portal_hti_project_controls_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_hti_project_controls_client_idx ON public.client_portal_hti_project_controls USING btree (client_id, project_no);


--
-- Name: client_portal_hti_purchase_fp_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_hti_purchase_fp_client_idx ON public.client_portal_hti_purchase_fp_entries USING btree (client_id, COALESCE(invoice_date, faktur_date) DESC, created_at DESC, id);


--
-- Name: client_portal_hti_purchase_fp_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_hti_purchase_fp_project_idx ON public.client_portal_hti_purchase_fp_entries USING btree (client_id, project_no, COALESCE(invoice_date, faktur_date) DESC);


--
-- Name: client_portal_hti_purchase_non_ppn_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_hti_purchase_non_ppn_client_idx ON public.client_portal_hti_purchase_non_ppn_entries USING btree (client_id, COALESCE(invoice_date, faktur_date) DESC, created_at DESC, id);


--
-- Name: client_portal_hti_purchase_non_ppn_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_hti_purchase_non_ppn_project_idx ON public.client_portal_hti_purchase_non_ppn_entries USING btree (client_id, project_no, COALESCE(invoice_date, faktur_date) DESC);


--
-- Name: client_portal_hti_sales_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_hti_sales_client_idx ON public.client_portal_hti_sales_entries USING btree (client_id, COALESCE(invoice_date, faktur_date) DESC, created_at DESC, id);


--
-- Name: client_portal_hti_sales_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_hti_sales_project_idx ON public.client_portal_hti_sales_entries USING btree (client_id, project_no, COALESCE(invoice_date, faktur_date) DESC);


--
-- Name: client_portal_hti_supplier_master_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_hti_supplier_master_client_idx ON public.client_portal_hti_supplier_master USING btree (client_id, supplier_code);


--
-- Name: client_portal_jurnal_adjustment_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_jurnal_adjustment_client_idx ON public.client_portal_jurnal_adjustment_entries USING btree (client_id, entry_date, created_at, id);


--
-- Name: client_portal_jurnal_adjustment_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_jurnal_adjustment_type_idx ON public.client_portal_jurnal_adjustment_entries USING btree (client_id, journal_type, entry_date, created_at, id);


--
-- Name: client_portal_mobile_upload_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_mobile_upload_client_idx ON public.client_portal_mobile_upload_sessions USING btree (client_id, expires_at DESC);


--
-- Name: client_portal_neraca_lajur_opening_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_neraca_lajur_opening_client_idx ON public.client_portal_neraca_lajur_opening_balances USING btree (client_id, coa_code);


--
-- Name: client_portal_period_postings_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_period_postings_client_idx ON public.client_portal_period_postings USING btree (client_id, period_year, period_month);


--
-- Name: client_portal_po_customer_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_po_customer_client_idx ON public.client_portal_po_customer_entries USING btree (client_id, po_date, created_at, id);


--
-- Name: client_portal_tbb_fish_master_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_tbb_fish_master_client_idx ON public.client_portal_tbb_fish_master USING btree (client_id, fish_code);


--
-- Name: client_portal_tbb_purchase_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_tbb_purchase_client_idx ON public.client_portal_tbb_purchase_entries USING btree (client_id, purchase_date DESC, created_at DESC, id);


--
-- Name: client_portal_tbb_sales_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_tbb_sales_client_idx ON public.client_portal_tbb_sales_entries USING btree (client_id, invoice_date DESC, created_at DESC, id);


--
-- Name: client_portal_tbb_settlement_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_tbb_settlement_client_idx ON public.client_portal_tbb_settlement_entries USING btree (client_id, settlement_type, settlement_date DESC, created_at DESC, id);


--
-- Name: client_portal_tbb_supplier_master_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_portal_tbb_supplier_master_client_idx ON public.client_portal_tbb_supplier_master USING btree (client_id, supplier_code);


--
-- Name: cloud_activity_logs_action_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cloud_activity_logs_action_key_idx ON public.cloud_activity_logs USING btree (action_key);


--
-- Name: cloud_activity_logs_actor_username_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cloud_activity_logs_actor_username_idx ON public.cloud_activity_logs USING btree (actor_username);


--
-- Name: cloud_activity_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cloud_activity_logs_created_at_idx ON public.cloud_activity_logs USING btree (created_at DESC);


--
-- Name: cloud_activity_logs_module_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cloud_activity_logs_module_id_idx ON public.cloud_activity_logs USING btree (module_id);


--
-- Name: cloud_activity_logs_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cloud_activity_logs_status_idx ON public.cloud_activity_logs USING btree (status);


--
-- Name: idx_app_sheet_rows_source_sheet; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_app_sheet_rows_source_sheet ON public.app_sheet_rows USING btree (source_key, sheet_name, row_number);


--
-- Name: idx_app_sheet_sources_module_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_app_sheet_sources_module_updated ON public.app_sheet_sources USING btree (module, updated_at DESC);


--
-- Name: idx_bre_sheet_rows_module_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bre_sheet_rows_module_updated ON public.bre_sheet_rows USING btree (module, updated_at DESC);


--
-- Name: idx_clients_legacy_row_number_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_clients_legacy_row_number_unique ON public.clients USING btree (legacy_row_number) WHERE (legacy_row_number IS NOT NULL);


--
-- Name: idx_desktop_file_sessions_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_desktop_file_sessions_created_by ON public.desktop_file_sessions USING btree (created_by_user_id, created_at DESC);


--
-- Name: idx_desktop_file_sessions_file_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_desktop_file_sessions_file_status ON public.desktop_file_sessions USING btree (source_type, record_id, file_id, status, expires_at DESC);


--
-- Name: idx_employee_database_client_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_database_client_name ON public.employee_database USING btree (upper(client_name), lower(nama_karyawan));


--
-- Name: idx_employee_database_client_nik_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_employee_database_client_nik_unique ON public.employee_database USING btree (upper(client_name), nik) WHERE ((nik IS NOT NULL) AND (nik <> ''::text));


--
-- Name: idx_invoices_legacy_row_number_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_invoices_legacy_row_number_unique ON public.invoices USING btree (legacy_row_number) WHERE (legacy_row_number IS NOT NULL);


--
-- Name: idx_kk_pph21_manual_entries_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kk_pph21_manual_entries_lookup ON public.kk_pph21_manual_entries USING btree (client_name, tax_year, month_name, sub_tax_type, updated_at DESC);


--
-- Name: idx_office_attendance_entries_daily_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_office_attendance_entries_daily_user ON public.office_attendance_entries USING btree (attendance_date, user_id) WHERE (user_id IS NOT NULL);


--
-- Name: idx_office_attendance_entries_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_office_attendance_entries_date ON public.office_attendance_entries USING btree (attendance_date DESC, check_in_at DESC);


--
-- Name: idx_office_attendance_qr_date_type; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_office_attendance_qr_date_type ON public.office_attendance_qr_tokens USING btree (attendance_date, token_type);


--
-- Name: idx_office_calendar_entries_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_office_calendar_entries_date ON public.office_calendar_entries USING btree (calendar_date);


--
-- Name: app_sheet_rows app_sheet_rows_source_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_sheet_rows
    ADD CONSTRAINT app_sheet_rows_source_key_fkey FOREIGN KEY (source_key) REFERENCES public.app_sheet_sources(source_key) ON DELETE CASCADE;


--
-- Name: client_portal_hti_advance_allocations client_portal_hti_advance_allocations_advance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_portal_hti_advance_allocations
    ADD CONSTRAINT client_portal_hti_advance_allocations_advance_id_fkey FOREIGN KEY (advance_id) REFERENCES public.client_portal_hti_advance_entries(id) ON DELETE CASCADE;


--
-- Name: employee_database employee_database_ptkp_status_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_database
    ADD CONSTRAINT employee_database_ptkp_status_fkey FOREIGN KEY (ptkp_status) REFERENCES public.employee_ptkp_statuses(code);


--
-- Name: office_attendance_entries office_attendance_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_attendance_entries
    ADD CONSTRAINT office_attendance_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--



