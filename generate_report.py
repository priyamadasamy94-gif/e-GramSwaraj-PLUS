import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_document():
    doc = Document()

    # Page setup - Margins: 1 inch (72pt)
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1.1)
        section.right_margin = Inches(1)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11)

    # Styles setup
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(12)
    normal_style.font.color.rgb = RGBColor(0x11, 0x11, 0x11)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(6)

    # Colors
    DARK_BLUE = RGBColor(0x00, 0x33, 0x66)
    BLACK = RGBColor(0x00, 0x00, 0x00)
    MUTED = RGBColor(0x55, 0x55, 0x55)

    # Helper Functions
    def add_title_line(text, size=14, bold=True, space_after=12, align=WD_ALIGN_PARAGRAPH.CENTER, color=BLACK):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(0)
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.color.rgb = color
        return p

    def add_heading_chapter(chap_num, chap_title):
        p1 = doc.add_paragraph()
        p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p1.paragraph_format.space_before = Pt(18)
        p1.paragraph_format.space_after = Pt(4)
        run1 = p1.add_run(f"CHAPTER {chap_num}")
        run1.font.name = 'Times New Roman'
        run1.font.size = Pt(14)
        run1.font.bold = True
        run1.font.color.rgb = BLACK

        p2 = doc.add_paragraph()
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p2.paragraph_format.space_before = Pt(0)
        p2.paragraph_format.space_after = Pt(18)
        run2 = p2.add_run(chap_title.upper())
        run2.font.name = 'Times New Roman'
        run2.font.size = Pt(14)
        run2.font.bold = True
        run2.font.color.rgb = BLACK

    def add_section_heading(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = BLACK
        return p

    def add_subheading_underlined(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)
        run.font.bold = True
        run.font.underline = True
        run.font.color.rgb = BLACK
        return p

    def add_paragraph(text, bold_prefix=None, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            run_b = p.add_run(bold_prefix)
            run_b.font.name = 'Times New Roman'
            run_b.font.size = Pt(12)
            run_b.font.bold = True
        run_t = p.add_run(text)
        run_t.font.name = 'Times New Roman'
        run_t.font.size = Pt(12)
        return p

    def add_bullet_point(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            run_b = p.add_run(bold_prefix + " ")
            run_b.font.name = 'Times New Roman'
            run_b.font.size = Pt(12)
            run_b.font.bold = True
        run_t = p.add_run(text)
        run_t.font.name = 'Times New Roman'
        run_t.font.size = Pt(12)
        return p

    def set_cell_background(cell, hex_color):
        tcPr = cell._element.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        tcPr.append(shd)

    def set_cell_padding(cell, top=100, bottom=100, left=150, right=150):
        tcPr = cell._element.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def set_table_borders(table, color="D3D3D3", sz="4", val="single"):
        tblPr = table._element.xpath('w:tblPr')
        if tblPr:
            borders = parse_xml(f'<w:tblBorders {nsdecls("w")}><w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/><w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/><w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/><w:insideV w:val="none"/><w:left w:val="none"/><w:right w:val="none"/></w:tblBorders>')
            tblPr[0].append(borders)

    def add_table(headers, rows, col_widths=None, alignment=WD_TABLE_ALIGNMENT.CENTER):
        table = doc.add_table(rows=len(rows) + 1, cols=len(headers))
        table.alignment = alignment
        set_table_borders(table)

        # Header Row
        hdr_cells = table.rows[0].cells
        for i, header_text in enumerate(headers):
            hdr_cells[i].text = header_text
            set_cell_background(hdr_cells[i], "F0F4F8")
            set_cell_padding(hdr_cells[i], top=120, bottom=120, left=150, right=150)
            p = hdr_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(11)
                r.font.bold = True
                r.font.color.rgb = BLACK

        # Data Rows
        for r_idx, row_data in enumerate(rows):
            row_cells = table.rows[r_idx + 1].cells
            bg_color = "FFFFFF" if r_idx % 2 == 0 else "FBFBFB"
            for c_idx, cell_value in enumerate(row_data):
                row_cells[c_idx].text = str(cell_value)
                set_cell_background(row_cells[c_idx], bg_color)
                set_cell_padding(row_cells[c_idx], top=100, bottom=100, left=150, right=150)
                p = row_cells[c_idx].paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                for r in p.runs:
                    r.font.name = 'Times New Roman'
                    r.font.size = Pt(10.5)

        if col_widths:
            for row in table.rows:
                for c_idx, width in enumerate(col_widths):
                    row.cells[c_idx].width = Inches(width)

        doc.add_paragraph().paragraph_format.space_after = Pt(4)
        return table

    def add_table_caption(caption_text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(14)
        run = p.add_run(caption_text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(11)
        run.font.italic = True
        run.font.color.rgb = BLACK
        return p

    def add_screenshot_placeholder(fig_num, fig_title):
        # 1-cell box table for clean placeholder formatting
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        cell.width = Inches(6.2)
        set_cell_background(cell, "F8F9FA")
        set_cell_padding(cell, top=300, bottom=300, left=200, right=200)

        # Set dashed border for placeholder
        tcPr = cell._element.get_or_add_tcPr()
        borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/><w:left w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/><w:right w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/></w:tcBorders>')
        tcPr.append(borders)

        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(24)
        p.paragraph_format.space_after = Pt(8)
        run1 = p.add_run(f"📷 [ PASTE SCREENSHOT HERE: {fig_num} {fig_title} ]\n")
        run1.font.name = 'Times New Roman'
        run1.font.size = Pt(11)
        run1.font.bold = True
        run1.font.color.rgb = DARK_BLUE

        run2 = p.add_run("(Leave space provided box / Replace this box with your image screenshot)")
        run2.font.name = 'Times New Roman'
        run2.font.size = Pt(9.5)
        run2.font.italic = True
        run2.font.color.rgb = MUTED

        # Caption under placeholder
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(6)
        p_cap.paragraph_format.space_after = Pt(16)
        run_c = p_cap.add_run(f"{fig_num} {fig_title}")
        run_c.font.name = 'Times New Roman'
        run_c.font.size = Pt(11)
        run_c.font.italic = True
        run_c.font.bold = True
        run_c.font.color.rgb = BLACK

    # ==================== PAGE 1: TITLE PAGE ====================
    add_title_line("`E-GRAMSWARAJ DIGITAL GOVERNANCE PLATFORM FOR VILLAGE PANCHAYAT OPERATIONS`", size=15, bold=True, space_after=18)
    add_title_line("23CS54C – MODERN WEB TECHNOLOGIES", size=13, bold=True, space_after=24)
    add_title_line("Submitted by", size=12, bold=False, space_after=12)
    add_title_line("PRIYA M 2403957610422100", size=13, bold=True, space_after=24)
    add_title_line("In partial fulfillment for the award of the degree", size=12, bold=False, space_after=6)
    add_title_line("of", size=12, bold=False, space_after=6)
    add_title_line("BACHELOR OF ENGINEERING", size=13, bold=True, space_after=6)
    add_title_line("in", size=12, bold=False, space_after=6)
    add_title_line("COMPUTER SCIENCE AND ENGINEERING", size=13, bold=True, space_after=30)

    # Logo Placeholder on Title Page
    t_table = doc.add_table(rows=1, cols=1)
    t_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_cell = t_table.cell(0, 0)
    t_cell.width = Inches(2.2)
    set_cell_background(t_cell, "FAFAFA")
    set_cell_padding(t_cell, top=150, bottom=150, left=100, right=100)
    tp = t_cell.paragraphs[0]
    tp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    trun = tp.add_run("[ COLLEGE LOGO HERE ]")
    trun.font.name = 'Times New Roman'
    trun.font.size = Pt(10)
    trun.font.bold = True
    trun.font.color.rgb = MUTED
    doc.add_paragraph().paragraph_format.space_after = Pt(24)

    add_title_line("NATIONAL ENGINEERING COLLEGE", size=14, bold=True, space_after=4)
    add_title_line("(An Autonomous Institution affiliated to Anna University, Chennai)", size=12, bold=True, space_after=4)
    add_title_line("K.R.NAGAR, KOVILPATTI - 628503", size=12, bold=True, space_after=24)
    add_title_line("OCTOBER - 2026", size=12, bold=True, space_after=0)

    doc.add_page_break()

    # ==================== PAGE 2: BONAFIDE CERTIFICATE ====================
    add_title_line("NATIONAL ENGINEERING COLLEGE", size=14, bold=True, space_after=4)
    add_title_line("(An Autonomous Institution affiliated to Anna University, Chennai)", size=12, bold=True, space_after=4)
    add_title_line("K.R.NAGAR, KOVILPATTI - 628503", size=12, bold=True, space_after=18)

    # Logo Placeholder on Certificate Page
    c_table = doc.add_table(rows=1, cols=1)
    c_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_cell = c_table.cell(0, 0)
    c_cell.width = Inches(2.0)
    set_cell_background(c_cell, "FAFAFA")
    set_cell_padding(c_cell, top=120, bottom=120, left=100, right=100)
    cp = c_cell.paragraphs[0]
    cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    crun = cp.add_run("[ COLLEGE LOGO HERE ]")
    crun.font.name = 'Times New Roman'
    crun.font.size = Pt(10)
    crun.font.bold = True
    crun.font.color.rgb = MUTED
    doc.add_paragraph().paragraph_format.space_after = Pt(18)

    add_title_line("BONAFIDE CERTIFICATE", size=14, bold=True, space_after=24)

    p_cert = doc.add_paragraph()
    p_cert.paragraph_format.space_after = Pt(40)
    p_cert.paragraph_format.line_spacing = 1.25
    r_cert = p_cert.add_run("This is to certify that this project report, “E-GramSwaraj – a village management”, is the bonafide work of ")
    r_cert.font.name = 'Times New Roman'
    r_cert.font.size = Pt(12)
    r_cert2 = p_cert.add_run("PRIYA M (2403957610422100)")
    r_cert2.font.name = 'Times New Roman'
    r_cert2.font.size = Pt(12)
    r_cert2.font.bold = True
    r_cert3 = p_cert.add_run(" who carried out the project work under my supervision.")
    r_cert3.font.name = 'Times New Roman'
    r_cert3.font.size = Pt(12)

    add_title_line("Course Instructor/Guide", size=12, bold=True, space_after=40, align=WD_ALIGN_PARAGRAPH.RIGHT)

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(50)
    p_sub.paragraph_format.line_spacing = 1.15
    r_sub = p_sub.add_run("Submitted to the 23CS54C – MODERN WEB TECHNOLOGIES Viva-Voce examination held at National Engineering College, K.R.Nagar, Kovilpatti on ____________")
    r_sub.font.name = 'Times New Roman'
    r_sub.font.size = Pt(12)

    p_exam = doc.add_paragraph()
    p_exam.paragraph_format.space_after = Pt(0)
    r_ex1 = p_exam.add_run("Internal Examiner")
    r_ex1.font.name = 'Times New Roman'
    r_ex1.font.size = Pt(12)
    r_ex1.font.bold = True
    r_ex_space = p_exam.add_run("\t\t\t\t\t\t\t")
    r_ex2 = p_exam.add_run("Co Examiner")
    r_ex2.font.name = 'Times New Roman'
    r_ex2.font.size = Pt(12)
    r_ex2.font.bold = True

    doc.add_page_break()

    # ==================== PAGE 3: TABLE OF CONTENTS ====================
    add_title_line("TABLE OF CONTENTS", size=14, bold=True, space_after=18)

    toc_headers = ["CH NO", "TITLE", "PAGE NO"]
    toc_rows = [
        ["1", "INTRODUCTION", "3"],
        ["2", "OBJECTIVES", "4"],
        ["3", "DESCRIPTION", "5"],
        ["4", "CLASS DIAGRAM", "6"],
        ["5", "TABLE STRUCTURES", "7"],
        ["6", "ER DIAGRAM", "16"],
        ["7", "TECH STACK", "18"],
        ["8", "MODULES", "19"],
        ["9", "CONCLUSION", "58"]
    ]
    add_table(toc_headers, toc_rows, col_widths=[1.2, 4.0, 1.3])

    doc.add_page_break()

    # ==================== CHAPTER 1: INTRODUCTION ====================
    add_heading_chapter(1, "INTRODUCTION")

    add_paragraph("In the modern governance ecosystem of rural India, the efficient administration of Panchayati Raj institutions plays a vital role in ensuring sustainable community growth, transparent resource allocation, and accountable public service delivery. Historically, managing village infrastructure projects, local asset registries, financial transactions, citizen welfare requisitions, and Gram Sabha meeting records through paper-based or disconnected ledger systems has been time-consuming, prone to human error, and lacking in public transparency. There is an urgent need for a unified digital platform that automates village panchayat operations under one roof.")

    add_paragraph("E-GramSwaraj+ is a comprehensive, full-stack digital governance web application designed to digitize and automate the complete lifecycle of village panchayat operations—from resident registration and public complaint processing to multi-year development planning, work execution, asset tracking, financial budget allocation, and dynamic multi-lingual governance. The system was specifically built to cater to the operational requirements of South Thittankulam Village Panchayat (LGD Code: 231907, Kovilpatti Taluk, Tamil Nadu - 628502) while offering multi-tenant architectural readiness for seamless scaling to adjacent villages.")

    add_paragraph("The application is organized into six major functional domains: Master Data & Village Profile Management, which maintains foundational records for village geography, wards, demographics, and resident profiles; Citizen Services & Requisitions, which manages resident self-registration, OTP authentication, and service request workflows; Development Plans & Works Execution, which monitors project lifecycles from proposal to contractor allocation and completion; Financial & Budgetary Control, which enforces strict ledger accounting for income, expenditure, and category-wise budgets; Gram Sabha Meetings & Governance, which records meeting schedules, resolutions, and attendance; and Multi-lingual Localization & Business Intelligence, which powers dynamic 8-language translations via Google Cloud Translation API alongside interactive administrative dashboards.")

    add_paragraph("The system runs on a robust modern stack combining React 18, Vite, Tailwind CSS, Recharts, and Leaflet on the frontend, with Node.js, Express.js v4, Sequelize ORM v6, and MySQL 8 on the backend. Secured using JSON Web Tokens (JWT), bcrypt password hashing, HTTP hardening via Helmet, CORS restrictions, and IP rate limiting, the application is production-ready. This report documents the complete design, architectural design, database schemas, API contracts, module specifications, and implementation details of E-GramSwaraj+.")

    # ==================== CHAPTER 2: OBJECTIVES ====================
    add_heading_chapter(2, "OBJECTIVES")

    add_paragraph("The objectives of E-GramSwaraj+ are:")

    add_bullet_point("Replace manual paper registers with an interactive full-stack digital platform for improved operational efficiency, real-time data access, and institutional auditability.", "• Digitize Panchayat Operations –")
    add_bullet_point("Maintain standardized and validated master records for village demographics, ward boundaries, infrastructure assets, and resident citizen catalogs under a single MySQL database source of truth.", "• Centralize Village Master Data –")
    add_bullet_point("Streamline village development from initial proposal to financial sanctioning, contractor assignment, milestone tracking, and completion verification with complete history traceability.", "• Automate Development Plan & Works Lifecycle –")
    add_bullet_point("Provide citizens with direct self-registration, secure OTP verification, and online submission of civic issues (e.g. water supply, street lighting, drainage) with real-time status updates.", "• Empower Citizens via Requisitions & Complaints –")
    add_bullet_point("Record every receipt and expenditure transaction against category-specific annual budgets, automatically computing remaining balances and preventing budget overallocation.", "• Ensure Financial Transparency & Budget Integrity –")
    add_bullet_point("Schedule panchayat board and Gram Sabha meetings, document formal agendas, log gender-disaggregated public attendance, and store official resolutions in an indexed digital format.", "• Facilitate Digital Gram Sabha Governance –")
    add_bullet_point("Implement dynamic translations across 8 Indian languages (English, Tamil, Hindi, Telugu, Kannada, Malayalam, Marathi, Bengali) using Google Cloud Translation API backed by a high-speed database cache.", "• Provide Dynamic Multi-lingual Access –")
    add_bullet_point("Protect sensitive administrative operations using JWT authentication, salted bcrypt password hashing, express rate limiting, Helmet headers, and strict role-based authorization (ADMIN, PANCHAYAT_OFFICER, OVERSEER, WATER_OPERATOR, CITIZEN).", "• Enforce Enterprise Security & Role-Based Access –")
    add_bullet_point("Build a decoupled architecture separating Vite React frontend views, Express REST API controllers, and Sequelize ORM models to allow straightforward future scaling and modular updates.", "• Deploy a Scalable, Maintainable REST Architecture –")
    add_bullet_point("Structure application configuration, database seeders, and environment scripts for automated deployment pipelines and zero-downtime production maintenance.", "• Enable Automated CI/CD & Production Quality –")

    # ==================== CHAPTER 3: DESCRIPTION ====================
    add_heading_chapter(3, "DESCRIPTION")

    add_paragraph("E-GramSwaraj+ is a web application for modernizing and digitizing Panchayati Raj administrative and public services inside a village panchayat. A visitor lands on a public village information page, registers or signs in, and is directed to an role-tailored dashboard. The top and sidebar navigation expose the core modules: Village Profile, Citizen Services, Works & Development Plans, Asset Management, Financial Ledger & Budgets, Gram Sabha Meetings, Announcements, Notifications, Analytics, and System Settings.")

    add_paragraph("The system is organized into three main functional areas. Village Master Data & Citizen Catalogue covers village geography, population demographics, ward breakdowns, official contacts, facility registries, and resident citizen profiles. Operations & Project Management covers civic grievance lifecycle (Submitted, Verified, In Progress, Resolved, Rejected), civil works tracking from initial proposal to contractor allocation and completion, and GIS asset mapping with maintenance interval logging. Financial Control & Governance covers receipt/expenditure vouchers, category-wise annual budgets, Gram Sabha meeting scheduling, resolutions, attendance recording, and 8-language dynamic localization.")

    add_paragraph("Five roles exist. A Citizen can submit requisitions, track grievance status, view meeting schedules, and access village information. A Panchayat Officer manages village profiles, approves requisitions, schedules Gram Sabha meetings, and monitors works. An Overseer verifies civil engineering progress and asset maintenance. A Water Operator manages water supply schemes and civic utility assets. An Admin possesses full system privilege to manage user roles, system settings, and security policies. Route protection is enforced in the browser by a protected-route wrapper and on the server by JWT authentication and role-based authorization middleware.")

    add_paragraph("E-GramSwaraj+ runs in two cooperating modes. The React client maintains a seeded, working dataset in browser local storage and offline cache, allowing screens to render essential data when offline. When the Express REST API backend answers its health check, the application seamlessly communicates with Node.js and Sequelize ORM over MySQL 8, attaching signed Bearer tokens to every API call. The backend REST API exposes over 35 endpoint handlers across eight distinct route groups.")

    add_paragraph("Financial receipts and expenditure vouchers are recorded with strict DECIMAL precision and automatic financial year calculation (e.g. 2026-2027), ensuring zero floating-point calculation errors and real-time budget balance enforcement.")

    # ==================== CHAPTER 4: CLASS DIAGRAM ====================
    add_heading_chapter(4, "CLASS DIAGRAM")

    add_paragraph("The class diagram shows the persistent entities of E-GramSwaraj+ together with the controller/service operations that act on them. Every Sequelize ORM model is represented as a class with its attributes, validations, and controller methods that read or modify it. Relationships are logical and relational foreign keys, for example User.villageId refers to Village.id and Work.planId refers to DevelopmentPlan.id.")

    add_screenshot_placeholder("Fig 4.1", "Class diagram of E-GramSwaraj+")

    # ==================== CHAPTER 5: TABLE STRUCTURES ====================
    add_heading_chapter(5, "TABLE STRUCTURES")

    add_paragraph("E-GramSwaraj+ uses MySQL 8, a relational database, with fifteen Sequelize ORM tables. Each table below is the schema of one model: field name, data type, whether it is required (Null = NO), key type (PRI primary key, UNI unique, MUL foreign key) and the default value. Every document receives an automatic _id of type UUID. Sequelize adds createdAt and updatedAt timestamps automatically.")

    # 5.1 VILLAGES
    add_section_heading("5.1 VILLAGES (villages)")
    add_paragraph("Stores foundational reference data for South Thittankulam Village Panchayat, including geography, population statistics, household counts, ward breakdowns, and official contacts.")
    v_headers = ["Field", "Type", "Null", "Key", "Default"]
    v_rows = [
        ["_id", "UUID", "NO", "PRI", "UUIDV4"],
        ["name", "String (varchar 255)", "NO", "", "null"],
        ["villageCode", "String (varchar 255)", "NO", "UNI", "STK"],
        ["panchayatName", "String (varchar 255)", "YES", "", "null"],
        ["block", "String (varchar 255)", "YES", "", "Kovilpatti"],
        ["taluk", "String (varchar 255)", "NO", "", "Kovilpatti"],
        ["district", "String (varchar 255)", "YES", "", "Thoothukkudi"],
        ["state", "String (varchar 255)", "NO", "", "Tamil Nadu"],
        ["pincode", "String (varchar 255)", "NO", "", "628502"],
        ["population", "Integer", "YES", "", "14317"],
        ["households", "Integer", "YES", "", "5386"],
        ["wards", "Integer", "YES", "", "9"],
        ["area", "Decimal (14,2)", "YES", "", "4.0"],
        ["latitude", "Float", "YES", "", "9.1720"],
        ["longitude", "Float", "YES", "", "77.8810"],
        ["lgdCode", "String (varchar 255)", "YES", "", "'231907'"],
        ["status", "enum(ACTIVE, INACTIVE)", "NO", "", "ACTIVE"],
        ["createdAt / updatedAt", "Date", "NO", "", "timestamps"]
    ]
    add_table(v_headers, v_rows, col_widths=[1.5, 1.8, 0.8, 0.8, 1.3])
    add_table_caption("Table 5.1 Structure of the villages collection")

    # 5.2 USERS
    add_section_heading("5.2 USERS (users)")
    add_paragraph("Stores every registered administrative officer and citizen account. Passwords are stored only as salted bcrypt hashes (cost factor 12), and role separates citizens from administrative officers.")
    u_headers = ["Field", "Type", "Null", "Key", "Default"]
    u_rows = [
        ["_id", "UUID", "NO", "PRI", "UUIDV4"],
        ["name", "String (varchar 255)", "NO", "", "null"],
        ["email", "String (varchar 255)", "NO", "UNI", "null"],
        ["password", "String (bcrypt hash)", "NO", "", "null"],
        ["role", "enum(ADMIN, OFFICER, OVERSEER, WATER_OPERATOR, CITIZEN)", "NO", "", "CITIZEN"],
        ["villageId", "UUID", "NO", "MUL", "FK -> villages"],
        ["phone", "String (varchar 255)", "YES", "UNI", "null"],
        ["designation", "String (varchar 255)", "YES", "", "null"],
        ["language", "enum(en, ta, hi, te, kn, ml, mr, bn)", "YES", "", "en"],
        ["status", "enum(ACTIVE, INACTIVE)", "NO", "", "ACTIVE"],
        ["lastLoginAt", "Date", "YES", "", "null"],
        ["createdAt / updatedAt", "Date", "NO", "", "timestamps"]
    ]
    add_table(u_headers, u_rows, col_widths=[1.5, 1.8, 0.8, 0.8, 1.3])
    add_table_caption("Table 5.2 Structure of the users collection")

    # 5.3 CITIZENS
    add_section_heading("5.3 CITIZENS (citizens)")
    add_paragraph("Holds resident citizen profiles linked to specific village wards, phone numbers, and optional user portal account logins.")
    c_headers = ["Field", "Type", "Null", "Key", "Default"]
    c_rows = [
        ["_id", "UUID", "NO", "PRI", "UUIDV4"],
        ["villageId", "UUID", "NO", "MUL", "FK -> villages"],
        ["name", "String (varchar 255)", "NO", "", "null"],
        ["phone", "String (varchar 255)", "YES", "", "null"],
        ["email", "String (varchar 255)", "YES", "", "null"],
        ["address", "String (varchar 255)", "YES", "", "null"],
        ["ward", "String (varchar 255)", "YES", "", "Ward 1"],
        ["gender", "enum(MALE, FEMALE, OTHER, '')", "YES", "", "''"],
        ["userId", "UUID", "YES", "MUL", "FK -> users"],
        ["status", "enum(ACTIVE, INACTIVE)", "NO", "", "ACTIVE"],
        ["createdAt / updatedAt", "Date", "NO", "", "timestamps"]
    ]
    add_table(c_headers, c_rows, col_widths=[1.5, 1.8, 0.8, 0.8, 1.3])
    add_table_caption("Table 5.3 Structure of the citizens collection")

    # 5.4 DEVELOPMENT PLANS
    add_section_heading("5.4 DEVELOPMENT PLANS (developmentPlans)")
    add_paragraph("Stores multi-year Gram Panchayat Development Plans (GPDP) with categories, priority levels, estimated costs, and target completion dates.")
    dp_headers = ["Field", "Type", "Null", "Key", "Default"]
    dp_rows = [
        ["_id", "UUID", "NO", "PRI", "UUIDV4"],
        ["villageId", "UUID", "NO", "MUL", "FK -> villages"],
        ["title", "String (varchar 255)", "NO", "", "null"],
        ["description", "Text", "YES", "", "null"],
        ["category", "enum(Infrastructure, Water, Sanitation, Roads, Education, Health)", "NO", "", "Infrastructure"],
        ["priority", "enum(LOW, MEDIUM, HIGH, URGENT)", "NO", "", "MEDIUM"],
        ["estimatedCost", "Decimal (14,2)", "YES", "", "0.00"],
        ["status", "enum(PROPOSED, APPROVED, IN_PROGRESS, COMPLETED, REJECTED)", "NO", "", "PROPOSED"],
        ["progress", "Float", "YES", "", "0"],
        ["financialYear", "String (varchar 255)", "YES", "", "2026-2027"],
        ["createdBy", "UUID", "YES", "MUL", "FK -> users"],
        ["createdAt / updatedAt", "Date", "NO", "", "timestamps"]
    ]
    add_table(dp_headers, dp_rows, col_widths=[1.5, 1.8, 0.8, 0.8, 1.3])
    add_table_caption("Table 5.4 Structure of the developmentPlans collection")

    # 5.5 WORKS
    add_section_heading("5.5 WORKS (works)")
    add_paragraph("Monitors active civil engineering works, tracking activity codes, scheme allocations, estimated vs approved costs, assigned contractors, and completion percentages.")
    w_headers = ["Field", "Type", "Null", "Key", "Default"]
    w_rows = [
        ["_id", "UUID", "NO", "PRI", "UUIDV4"],
        ["villageId", "UUID", "NO", "MUL", "FK -> villages"],
        ["name", "String (varchar 255)", "NO", "", "null"],
        ["activityCode", "String (varchar 255)", "YES", "", "null"],
        ["workType", "String (varchar 255)", "YES", "", "New/Fresh"],
        ["category", "enum(Infrastructure, Water, Sanitation, Roads)", "YES", "", "null"],
        ["location", "String (varchar 255)", "YES", "", "null"],
        ["estimatedCost", "Decimal (14,2)", "YES", "", "0.00"],
        ["approvedAmount", "Decimal (14,2)", "YES", "", "0.00"],
        ["spentAmount", "Decimal (14,2)", "YES", "", "0.00"],
        ["contractor", "String (varchar 255)", "YES", "", "null"],
        ["status", "enum(PLANNED, APPROVED, IN_PROGRESS, COMPLETED, SUSPENDED)", "NO", "", "PLANNED"],
        ["progress", "Float", "YES", "", "0"],
        ["actualCompletionDate", "Date", "YES", "", "null"],
        ["createdAt / updatedAt", "Date", "NO", "", "timestamps"]
    ]
    add_table(w_headers, w_rows, col_widths=[1.5, 1.8, 0.8, 0.8, 1.3])
    add_table_caption("Table 5.5 Structure of the works collection")

    # 5.6 ASSETS
    add_section_heading("5.6 ASSETS (assets)")
    add_paragraph("Catalogs public physical assets (water tanks, hand pumps, street lights, community halls, roads) with GIS latitude/longitude coordinates and maintenance interval logs.")
    ast_headers = ["Field", "Type", "Null", "Key", "Default"]
    ast_rows = [
        ["_id", "UUID", "NO", "PRI", "UUIDV4"],
        ["villageId", "UUID", "NO", "MUL", "FK -> villages"],
        ["name", "String (varchar 255)", "NO", "", "null"],
        ["assetCode", "String (varchar 255)", "YES", "", "null"],
        ["type", "enum(WATER_TANK, STREET_LIGHT, RO_PLANT, BUILDING, ROAD, DRAINAGE)", "NO", "", "null"],
        ["ward", "String (varchar 255)", "YES", "", "null"],
        ["latitude", "Float (-90 to 90)", "YES", "", "null"],
        ["longitude", "Float (-180 to 180)", "YES", "", "null"],
        ["condition", "enum(EXCELLENT, GOOD, POOR, NON_FUNCTIONAL)", "NO", "", "GOOD"],
        ["estimatedValue", "Decimal (14,2)", "YES", "", "0.00"],
        ["maintenanceIntervalDays", "Integer", "YES", "", "180"],
        ["status", "enum(ACTIVE, INACTIVE, UNDER_MAINTENANCE)", "NO", "", "ACTIVE"],
        ["createdAt / updatedAt", "Date", "NO", "", "timestamps"]
    ]
    add_table(ast_headers, ast_rows, col_widths=[1.5, 1.8, 0.8, 0.8, 1.3])
    add_table_caption("Table 5.6 Structure of the assets collection")

    # 5.7 FINANCIAL TRANSACTIONS
    add_section_heading("5.7 FINANCIAL TRANSACTIONS (financialTransactions)")
    add_paragraph("Records public financial income receipts and expenditure payments linked to voucher references and financial years.")
    ft_headers = ["Field", "Type", "Null", "Key", "Default"]
    ft_rows = [
        ["_id", "UUID", "NO", "PRI", "UUIDV4"],
        ["villageId", "UUID", "NO", "MUL", "FK -> villages"],
        ["type", "enum(RECEIPT, EXPENDITURE)", "NO", "", "null"],
        ["category", "String (varchar 255)", "NO", "", "null"],
        ["description", "Text", "YES", "", "null"],
        ["amount", "Decimal (14,2)", "NO", "", "null"],
        ["referenceNumber", "String (varchar 255)", "YES", "", "null"],
        ["date", "Date", "NO", "", "CURRENT_TIMESTAMP"],
        ["financialYear", "String (varchar 255)", "YES", "MUL", "Auto-computed"],
        ["status", "enum(COMPLETED, PENDING, CANCELLED)", "NO", "", "COMPLETED"],
        ["createdAt / updatedAt", "Date", "NO", "", "timestamps"]
    ]
    add_table(ft_headers, ft_rows, col_widths=[1.5, 1.8, 0.8, 0.8, 1.3])
    add_table_caption("Table 5.7 Structure of the financialTransactions collection")

    # 5.8 BUDGETS
    add_section_heading("5.8 BUDGETS (budgets)")
    add_paragraph("Stores annual category budgets with allocated, utilized, and auto-computed remaining funds.")
    b_headers = ["Field", "Type", "Null", "Key", "Default"]
    b_rows = [
        ["_id", "UUID", "NO", "PRI", "UUIDV4"],
        ["villageId", "UUID", "NO", "MUL", "FK -> villages"],
        ["financialYear", "String (varchar 255)", "NO", "MUL", "null"],
        ["category", "String (varchar 255)", "NO", "MUL", "null"],
        ["allocatedAmount", "Decimal (14,2)", "NO", "", "0.00"],
        ["utilizedAmount", "Decimal (14,2)", "YES", "", "0.00"],
        ["remainingAmount", "Decimal (14,2)", "YES", "", "Auto-calculated"],
        ["source", "String (varchar 255)", "YES", "", "State Grant / Tax"],
        ["createdAt / updatedAt", "Date", "NO", "", "timestamps"]
    ]
    add_table(b_headers, b_rows, col_widths=[1.5, 1.8, 0.8, 0.8, 1.3])
    add_table_caption("Table 5.8 Structure of the budgets collection")

    # 5.9 MEETINGS
    add_section_heading("5.9 MEETINGS (meetings)")
    add_paragraph("Schedules Gram Sabha and Panchayat Board assembly meetings, documenting agendas, resolutions, and public attendance counts.")
    m_headers = ["Field", "Type", "Null", "Key", "Default"]
    m_rows = [
        ["_id", "UUID", "NO", "PRI", "UUIDV4"],
        ["villageId", "UUID", "NO", "MUL", "FK -> villages"],
        ["title", "String (varchar 255)", "NO", "", "null"],
        ["type", "enum(GRAM_SABHA, PANCHAYAT_BOARD, WARD_SABHA, STANDING_COMMITTEE)", "NO", "", "GRAM_SABHA"],
        ["date", "Date", "NO", "", "null"],
        ["location", "String (varchar 255)", "YES", "", "Panchayat Office"],
        ["agenda", "JSON Array", "YES", "", "[]"],
        ["minutes", "Text", "YES", "", "null"],
        ["decisions", "JSON Array", "YES", "", "[]"],
        ["attendance", "JSON Object (total, male, female, officials)", "YES", "", "{}"],
        ["status", "enum(SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)", "NO", "", "SCHEDULED"],
        ["createdAt / updatedAt", "Date", "NO", "", "timestamps"]
    ]
    add_table(m_headers, m_rows, col_widths=[1.5, 1.8, 0.8, 0.8, 1.3])
    add_table_caption("Table 5.9 Structure of the meetings collection")

    # 5.10 ANNOUNCEMENTS
    add_section_heading("5.10 ANNOUNCEMENTS (announcements)")
    add_paragraph("Stores public notices, policy advisories, and village news bulletins.")
    ann_headers = ["Field", "Type", "Null", "Key", "Default"]
    ann_rows = [
        ["_id", "UUID", "NO", "PRI", "UUIDV4"],
        ["villageId", "UUID", "NO", "MUL", "FK -> villages"],
        ["title", "String (varchar 255)", "NO", "", "null"],
        ["description", "Text", "NO", "", "null"],
        ["category", "enum(PUBLIC_INFORMATION, SCHEME_NOTICE, EMERGENCY_ALERT)", "NO", "", "PUBLIC_INFORMATION"],
        ["publishDate", "Date", "NO", "", "CURRENT_TIMESTAMP"],
        ["status", "enum(PUBLISHED, DRAFT, ARCHIVED)", "NO", "", "PUBLISHED"],
        ["pinned", "Boolean", "NO", "", "false"],
        ["createdAt / updatedAt", "Date", "NO", "", "timestamps"]
    ]
    add_table(ann_headers, ann_rows, col_widths=[1.5, 1.8, 0.8, 0.8, 1.3])
    add_table_caption("Table 5.10 Structure of the announcements collection")

    # 5.11 NOTIFICATIONS
    add_section_heading("5.11 NOTIFICATIONS (notifications)")
    add_paragraph("In-app alert notifications generated upon requisition status updates, meeting schedules, or system events.")
    n_headers = ["Field", "Type", "Null", "Key", "Default"]
    n_rows = [
        ["_id", "UUID", "NO", "PRI", "UUIDV4"],
        ["villageId", "UUID", "NO", "MUL", "FK -> villages"],
        ["userId", "UUID", "NO", "MUL", "FK -> users"],
        ["title", "String (varchar 255)", "NO", "", "null"],
        ["message", "Text", "YES", "", "null"],
        ["type", "enum(SYSTEM, GRIEVANCE, WORK, MEETING)", "NO", "", "SYSTEM"],
        ["read", "Boolean", "NO", "", "false"],
        ["createdAt / updatedAt", "Date", "NO", "", "timestamps"]
    ]
    add_table(n_headers, n_rows, col_widths=[1.5, 1.8, 0.8, 0.8, 1.3])
    add_table_caption("Table 5.11 Structure of the notifications collection")

    # 5.12 GRIEVANCES
    add_section_heading("5.12 GRIEVANCES (grievances)")
    add_paragraph("Stores public civic complaint submissions, issue categories, resolution stages, and audit history logs.")
    g_headers = ["Field", "Type", "Null", "Key", "Default"]
    g_rows = [
        ["_id", "UUID", "NO", "PRI", "UUIDV4"],
        ["villageId", "UUID", "NO", "MUL", "FK -> villages"],
        ["referenceNumber", "String (varchar 255)", "NO", "UNI", "Auto-generated"],
        ["citizenId", "UUID", "NO", "MUL", "FK -> citizens"],
        ["category", "enum(Water Supply, Street Lighting, Drainage, Roads, Garbage)", "NO", "", "null"],
        ["subject", "String (varchar 255)", "NO", "", "null"],
        ["description", "Text", "NO", "", "null"],
        ["ward", "String (varchar 255)", "YES", "", "null"],
        ["priority", "enum(LOW, MEDIUM, HIGH, URGENT)", "NO", "", "MEDIUM"],
        ["status", "enum(SUBMITTED, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, REJECTED)", "NO", "", "SUBMITTED"],
        ["resolution", "Text", "YES", "", "null"],
        ["createdAt / updatedAt", "Date", "NO", "", "timestamps"]
    ]
    add_table(g_headers, g_rows, col_widths=[1.5, 1.8, 0.8, 0.8, 1.3])
    add_table_caption("Table 5.12 Structure of the grievances collection")

    # 5.13 SERVICES & SERVICE REQUESTS
    add_section_heading("5.13 SERVICE REQUESTS (serviceRequests)")
    add_paragraph("Handles citizen applications for official certificates, public service permits, and administrative utility connections.")
    sr_headers = ["Field", "Type", "Null", "Key", "Default"]
    sr_rows = [
        ["_id", "UUID", "NO", "PRI", "UUIDV4"],
        ["villageId", "UUID", "NO", "MUL", "FK -> villages"],
        ["applicationNumber", "String (varchar 255)", "NO", "UNI", "SR-XXXXXXXX"],
        ["serviceId", "UUID", "NO", "MUL", "FK -> services"],
        ["applicantName", "String (varchar 255)", "NO", "", "null"],
        ["applicantPhone", "String (varchar 255)", "NO", "", "null"],
        ["ward", "String (varchar 255)", "YES", "", "null"],
        ["status", "enum(SUBMITTED, VERIFIED, IN_PROGRESS, APPROVED, REJECTED, COMPLETED)", "NO", "", "SUBMITTED"],
        ["assignedOfficer", "UUID", "YES", "MUL", "FK -> users"],
        ["slaDays", "Integer", "YES", "", "7"],
        ["createdAt / updatedAt", "Date", "NO", "", "timestamps"]
    ]
    add_table(sr_headers, sr_rows, col_widths=[1.5, 1.8, 0.8, 0.8, 1.3])
    add_table_caption("Table 5.13 Structure of the serviceRequests collection")

    # 5.14 TRANSLATION CACHE
    add_section_heading("5.14 TRANSLATION CACHE (translationCache)")
    add_paragraph("Stores SHA-256 hashed UI source text and dynamic Google Cloud Translation API outputs across 8 Indian languages.")
    tc_headers = ["Field", "Type", "Null", "Key", "Default"]
    tc_rows = [
        ["_id", "UUID", "NO", "PRI", "UUIDV4"],
        ["sourceHash", "String (varchar 64)", "NO", "UNI", "SHA-256 Hash"],
        ["sourceText", "Text", "NO", "", "null"],
        ["sourceLanguage", "String (varchar 8)", "NO", "", "en"],
        ["targetLanguage", "String (varchar 8)", "NO", "", "ta / hi / te / etc."],
        ["translatedText", "Text", "NO", "", "null"],
        ["createdAt / updatedAt", "Date", "NO", "", "timestamps"]
    ]
    add_table(tc_headers, tc_rows, col_widths=[1.5, 1.8, 0.8, 0.8, 1.3])
    add_table_caption("Table 5.14 Structure of the translationCache collection")

    # ==================== CHAPTER 6: ER DIAGRAM ====================
    add_heading_chapter(6, "ER DIAGRAM")

    add_paragraph("The entity-relationship diagram shows how the collections relate to one another. MySQL enforces relational foreign key constraints across tables (`villageId`, `userId`, `planId`, `workId`, `serviceId`). The villages collection is the central hub of the model: a village contains users, citizens, development plans, works, assets, financial transactions, budgets, meetings, and service requests.")

    add_section_heading("ENTITY RELATIONSHIP DIAGRAM")
    add_screenshot_placeholder("Fig 6.1", "Entity relationship diagram of E-GramSwaraj+")

    add_section_heading("RELATIONSHIP SUMMARY")
    er_headers = ["Parent", "Child", "Cardinality", "Reference field"]
    er_rows = [
        ["villages", "users", "1 : N", "users.villageId → villages.id"],
        ["villages", "citizens", "1 : N", "citizens.villageId → villages.id"],
        ["villages", "developmentPlans", "1 : N", "developmentPlans.villageId → villages.id"],
        ["villages", "works", "1 : N", "works.villageId → villages.id"],
        ["villages", "assets", "1 : N", "assets.villageId → villages.id"],
        ["villages", "financialTransactions", "1 : N", "financialTransactions.villageId → villages.id"],
        ["villages", "budgets", "1 : N", "budgets.villageId → villages.id"],
        ["villages", "meetings", "1 : N", "meetings.villageId → villages.id"],
        ["villages", "announcements", "1 : N", "announcements.villageId → villages.id"],
        ["users", "grievances", "1 : N", "grievances.citizenId → users.id"],
        ["services", "serviceRequests", "1 : N", "serviceRequests.serviceId → services.id"],
        ["users", "otpVerifications", "1 : N", "otpVerifications.userId → users.id"]
    ]
    add_table(er_headers, er_rows, col_widths=[1.5, 1.5, 1.2, 2.3])
    add_table_caption("Table 6.1 Relationship Summary of E-GramSwaraj+ Collections")

    # ==================== CHAPTER 7: TECH STACK ====================
    add_heading_chapter(7, "TECH STACK")

    add_section_heading("7.1 TECH STACK")
    ts_headers = ["Layer", "Technology", "Purpose"]
    ts_rows = [
        ["Frontend UI", "React 18 (Vite)", "Single-page application with dynamic UI rendering and fast module reloading."],
        ["Styling", "Tailwind CSS", "Utility-first responsive styling with consistent design system tokens."],
        ["Routing", "React Router v6", "Public, citizen, and officer routes guarded by role-based protected wrappers."],
        ["Charts & Maps", "Recharts, Leaflet, OpenStreetMap", "Interactive financial analytics charts and GIS asset spatial mapping."],
        ["Backend Server", "Node.js with Express v4", "Asynchronous, event-driven RESTful API server."],
        ["Database & ORM", "MySQL 8 + Sequelize ORM v6", "Relational database storage with schema migrations, validations, and hooks."],
        ["Authentication", "JSON Web Tokens (jsonwebtoken)", "Stateless, signed 7-day bearer token authentication."],
        ["Password Security", "bcryptjs", "Salted password hashing with cost factor 12."],
        ["HTTP Hardening", "Helmet, CORS, Express Rate Limit", "HTTP header protection, origin control, and rate limiting."],
        ["Localization", "Google Cloud Translation API + Cache", "Dynamic real-time translation across 8 Indian languages with SHA-256 caching."]
    ]
    add_table(ts_headers, ts_rows, col_widths=[1.5, 2.0, 3.0])
    add_table_caption("Table 7.1 Overview of E-GramSwaraj+ Technology Stack")

    add_section_heading("7.2 ARCHITECTURE OVERVIEW")
    arch_headers = ["Layer", "Technology Component", "Responsibility in E-GramSwaraj+"]
    arch_rows = [
        ["Model", "Sequelize ORM + MySQL 8", "Defines relational schemas, data validations, DB queries, and lifecycle hooks."],
        ["View", "React 18 UI + Tailwind CSS", "Renders interactive interfaces, manages client state, displays charts & maps."],
        ["Controller", "Express.js Route Controllers", "Executes business logic, validates API payloads, coordinates Model & View."]
    ]
    add_table(arch_headers, arch_rows, col_widths=[1.5, 2.0, 3.0])
    add_table_caption("Table 7.2 Architecture Layer Overview")

    # ==================== CHAPTER 8: MODULES ====================
    add_heading_chapter(8, "MODULES")

    # 8.1 Design Approach
    add_section_heading("8.1 Design Approach")
    add_paragraph("Each module of E-GramSwaraj+ is described the way a system design problem is solved: by walking through the same steps in the same order, every time. This keeps the explanation of every module complete and comparable, and shows why each design decision was taken rather than only what the screen looks like.")

    da_headers = ["Step", "Question it answers", "Presented in each module as"]
    da_rows = [
        ["1. Functional requirements", "What must the module do?", "Section x.1"],
        ["2. Non-functional requirements", "How well must it do it (security, performance, availability)?", "Section x.2"],
        ["3. API design", "What is the contract between client and server?", "Section x.3"],
        ["4. DB design", "Which collections, keys and indexes store the data?", "Section x.4"],
        ["5. Screenshots", "What does the finished module look like?", "Section x.5"]
    ]
    add_table(da_headers, da_rows, col_widths=[1.8, 3.2, 1.5])
    add_table_caption("Table 8.1 System Design Methodology Steps")

    # 8.2 Folder Structure
    add_section_heading("8.2 Folder Structure")
    add_paragraph("The project is a single repository with two independent applications: the Express API in backend and the React client in frontend. Figure 8.1 shows the backend directory structure, and Figure 8.2 shows the frontend directory structure.")

    add_subheading_underlined("Backend Folder")
    add_paragraph("The backend repository contains API route handlers, Sequelize models, security middleware, seeders, and translation services.")
    add_screenshot_placeholder("Fig 8.1", "Structure of backend folder")

    add_subheading_underlined("Frontend Folder")
    add_paragraph("The frontend repository contains React components, UI page views, custom context providers, and Axios service integrations.")
    add_screenshot_placeholder("Fig 8.2", "Structure of frontend folder")

    # 8.3 USER AUTHENTICATION & ACCESS CONTROL
    add_section_heading("8.3 USER AUTHENTICATION & ACCESS CONTROL")

    add_subheading_underlined("Purpose & Scope")
    add_paragraph("Provides account creation, sign-in, OTP validation, and role-based access control (RBAC) across administrative and citizen user accounts. It identifies every user with a signed JSON Web Token (JWT), separates citizens from officers, overseers, and administrators, and prevents unauthorized access to administrative functions.")

    add_subheading_underlined("Functional Requirements")
    add_paragraph("What the module must do:")
    add_bullet_point("A citizen can register with name, e-mail, phone, ward address, and password (minimum eight characters) with automated OTP verification.")
    add_bullet_point("A user can log in with e-mail or phone number and password, receiving a signed 7-day JWT Bearer token.")
    add_bullet_point("Role-based authorization enforces 5 distinct roles: ADMIN, PANCHAYAT_OFFICER, OVERSEER, WATER_OPERATOR, and CITIZEN.")
    add_bullet_point("An administrator can view user accounts, update designations, or suspend inactive accounts from the administration panel.")

    add_subheading_underlined("Non-Functional Requirements")
    add_paragraph("How well the module must do it:")
    add_bullet_point("Passwords are stored only as salted bcrypt hashes (cost factor 12) and are never returned by the API.", "Security:")
    add_bullet_point("Server JWT tokens expire after 7 days to balance administrative security with usability.", "Token lifetime:")
    add_bullet_point("Login attempts are rate-limited to 15 attempts per 15-minute window per IP.", "Rate limiting:")
    add_bullet_point("E-mail addresses and phone numbers are trimmed, lower-cased, and unique.", "Consistency:")

    add_subheading_underlined("API Design")
    auth_api_headers = ["Method", "Endpoint", "Purpose / contract"]
    auth_api_rows = [
        ["POST", "/api/users/login", "Body: email/phone, password. Authenticates credentials and returns signed JWT."],
        ["POST", "/api/users/register", "Body: name, email, phone, password, ward. Registers citizen profile & triggers OTP."],
        ["POST", "/api/users/verify-otp", "Body: userIdentifier, otp. Verifies OTP and activates user account."],
        ["GET", "/api/users/me", "Header: Bearer token. Returns authenticated user profile."]
    ]
    add_table(auth_api_headers, auth_api_rows, col_widths=[1.0, 2.2, 3.3])

    add_subheading_underlined("DB Design")
    auth_db_headers = ["Collection", "Keys & indexes", "Key fields"]
    auth_db_rows = [
        ["users", "_id, unique email, unique phone", "name, email, password (hash), role, villageId, phone, status"],
        ["otpVerifications", "_id, userIdentifier, purpose", "userIdentifier, otpHash, purpose, expiresAt, verified"]
    ]
    add_table(auth_db_headers, auth_db_rows, col_widths=[1.5, 2.2, 2.8])
    add_bullet_point("The unique indexes on email and phone prevent duplicate registrations.")
    add_bullet_point("The role field is an enum enforcing RBAC authorization across routes.")

    add_subheading_underlined("Screenshots")
    add_paragraph("The screens below show the user login interface, citizen registration page, and OTP verification dialog.")
    add_screenshot_placeholder("Fig 8.3", "User login screen with role-based login options")
    add_screenshot_placeholder("Fig 8.4", "Citizen registration and profile creation screen")
    add_screenshot_placeholder("Fig 8.5", "OTP Verification dialog for citizen onboarding")

    # 8.4 VILLAGE PROFILE & MASTER DATA MANAGEMENT
    add_section_heading("8.4 VILLAGE PROFILE & MASTER DATA MANAGEMENT")

    add_subheading_underlined("Purpose & Scope")
    add_paragraph("Centralizes foundational reference data for South Thittankulam Village Panchayat (LGD Code: 231907), including geography, population statistics, household counts, ward breakdowns, official contact directories, and village facility registries.")

    add_subheading_underlined("Functional Requirements")
    add_paragraph("What the module must do:")
    add_bullet_point("Maintain official village details: name, code ('STK'), LGD code (231907), block, taluk, district, state, and pincode.")
    add_bullet_point("Record population, household counts, ward divisions, geographic boundary area, and local public amenities.")
    add_bullet_point("Provide a facility registry detailing panchayat office, primary health center, schools, community halls, and water overhead tanks.")

    add_subheading_underlined("Non-Functional Requirements")
    add_paragraph("How well the module must do it:")
    add_bullet_point("Enforce unique key constraints on villageCode and LGD code.", "Data Integrity:")
    add_bullet_point("Village profile data is cached in client memory on startup to optimize load speed.", "Read Optimization:")

    add_subheading_underlined("API Design")
    v_api_headers = ["Method", "Endpoint", "Purpose / contract"]
    v_api_rows = [
        ["GET", "/api/villages", "Lists all village panchayats in the system."],
        ["GET", "/api/villages/:code", "Fetches complete master profile & demographics for a village code."],
        ["PUT", "/api/villages/:id", "Admin/Officer only. Updates village statistics, contact officers, or amenities."]
    ]
    add_table(v_api_headers, v_api_rows, col_widths=[1.0, 2.2, 3.3])

    add_subheading_underlined("DB Design")
    v_db_headers = ["Collection", "Keys & indexes", "Key fields"]
    v_db_rows = [
        ["villages", "_id, unique villageCode, lgdCode", "name, villageCode, taluk, district, state, population, lgdCode"],
        ["citizens", "_id, villageId, userId", "villageId, name, phone, email, address, ward, gender, status"]
    ]
    add_table(v_db_headers, v_db_rows, col_widths=[1.5, 2.2, 2.8])

    add_subheading_underlined("Screenshots")
    add_paragraph("The screens below show the village profile interface and demographic master data views.")
    add_screenshot_placeholder("Fig 8.6", "Village profile master data and demographics interface")
    add_screenshot_placeholder("Fig 8.7", "Village facility and public infrastructure directory")

    # 8.5 CITIZEN SERVICES & REQUISITIONS / GRIEVANCES MANAGEMENT
    add_section_heading("8.5 CITIZEN SERVICES & REQUISITIONS / GRIEVANCES MANAGEMENT")

    add_subheading_underlined("Purpose & Scope")
    add_paragraph("Empowers citizens to submit civic requisitions and public complaints (water supply, street lighting, drainage, road repairs, garbage removal) online, track resolution workflows, and receive status updates.")

    add_subheading_underlined("Functional Requirements")
    add_paragraph("What the module must do:")
    add_bullet_point("A citizen can submit a grievance with category, subject, description, ward location, and priority level.")
    add_bullet_point("Generates a unique tracking reference number (e.g. GRV-202610-XXXX) upon submission.")
    add_bullet_point("Panchayat officers can assign grievances to field staff and update resolution status (Submitted, Acknowledged, In Progress, Resolved).")

    add_subheading_underlined("Non-Functional Requirements")
    add_paragraph("How well the module must do it:")
    add_bullet_point("All status transitions are appended to an immutable audit history with timestamps.", "Traceability:")
    add_bullet_point("Citizens can view real-time status changes from their personal portal.", "Responsiveness:")

    add_subheading_underlined("API Design")
    g_api_headers = ["Method", "Endpoint", "Purpose / contract"]
    g_api_rows = [
        ["GET", "/api/grievances", "Lists grievances filtered by status, category, or citizen ID."],
        ["POST", "/api/grievances", "Creates a new civic complaint requisition and returns reference number."],
        ["PUT", "/api/grievances/:id/status", "Officer only. Updates grievance resolution status and appends remarks."]
    ]
    add_table(g_api_headers, g_api_rows, col_widths=[1.0, 2.2, 3.3])

    add_subheading_underlined("DB Design")
    g_db_headers = ["Collection", "Keys & indexes", "Key fields"]
    g_db_rows = [
        ["grievances", "_id, unique referenceNumber, citizenId", "referenceNumber, citizenId, category, subject, ward, status, history"],
        ["serviceRequests", "_id, unique applicationNumber", "applicationNumber, serviceId, applicantName, status, assignedOfficer"]
    ]
    add_table(g_db_headers, g_db_rows, col_widths=[1.5, 2.2, 2.8])

    add_subheading_underlined("Screenshots")
    add_paragraph("The screens below show the grievance submission portal and issue tracking workflow.")
    add_screenshot_placeholder("Fig 8.8", "Citizen civic grievance submission portal")
    add_screenshot_placeholder("Fig 8.9", "Grievance status tracking and resolution workflow")

    # 8.6 DEVELOPMENT PLANS & WORKS EXECUTION
    add_section_heading("8.6 DEVELOPMENT PLANS & WORKS EXECUTION")

    add_subheading_underlined("Purpose & Scope")
    add_paragraph("Orchestrates Gram Panchayat Development Plans (GPDP) and active civil infrastructure works from initial proposal to financial sanctioning, contractor assignment, and milestone completion.")

    add_subheading_underlined("Functional Requirements")
    add_paragraph("What the module must do:")
    add_bullet_point("Create multi-year development plans with categories (Infrastructure, Water, Sanitation, Roads), priority, and estimated cost.")
    add_bullet_point("Track active civil works with activity codes, location coordinates, scheme allocations, and contractor assignments.")
    add_bullet_point("Update physical progress (0-100%); auto-mark status COMPLETED when progress reaches 100%.")

    add_subheading_underlined("Non-Functional Requirements")
    add_paragraph("How well the module must do it:")
    add_bullet_point("All cost estimates and expenditure amounts are stored as DECIMAL(14,2).", "Precision:")
    add_bullet_point("Sequelize beforeSave hook auto-updates actualCompletionDate upon 100% progress.", "Automated Hook:")

    add_subheading_underlined("API Design")
    w_api_headers = ["Method", "Endpoint", "Purpose / contract"]
    w_api_rows = [
        ["GET", "/api/works", "Lists civil works filtered by status, category, or financial year."],
        ["POST", "/api/works", "Officer only. Creates a new civil work under a sanctioned development plan."],
        ["PUT", "/api/works/:id", "Overseer/Officer. Updates physical progress percentage, spent amount, or status."]
    ]
    add_table(w_api_headers, w_api_rows, col_widths=[1.0, 2.2, 3.3])

    add_subheading_underlined("DB Design")
    w_db_headers = ["Collection", "Keys & indexes", "Key fields"]
    w_db_rows = [
        ["developmentPlans", "_id, villageId, status", "title, category, priority, estimatedCost, status, financialYear"],
        ["works", "_id, villageId, status", "name, activityCode, category, location, estimatedCost, spentAmount, contractor, progress, status"]
    ]
    add_table(w_db_headers, w_db_rows, col_widths=[1.5, 2.2, 2.8])

    add_subheading_underlined("Screenshots")
    add_paragraph("The screens below show the development plan listing and civil works progress tracking.")
    add_screenshot_placeholder("Fig 8.10", "Gram Panchayat Development Plan (GPDP) listing")
    add_screenshot_placeholder("Fig 8.11", "Civil works monitoring & progress tracking screen")

    # 8.7 PUBLIC ASSET & INFRASTRUCTURE TRACKING
    add_section_heading("8.7 PUBLIC ASSET & INFRASTRUCTURE TRACKING")

    add_subheading_underlined("Purpose & Scope")
    add_paragraph("Manages public physical assets across the panchayat (water tanks, hand pumps, street lights, community halls, roads) with GIS coordinates and maintenance schedules.")

    add_subheading_underlined("Functional Requirements")
    add_paragraph("What the module must do:")
    add_bullet_point("Catalog assets by type (WATER_TANK, STREET_LIGHT, RO_PLANT, BUILDING, ROAD), ward location, asset code, and estimated value.")
    add_bullet_point("Store latitude/longitude coordinates to render assets on interactive Leaflet maps.")
    add_bullet_point("Track asset health condition (EXCELLENT, GOOD, POOR, NON_FUNCTIONAL) and log scheduled maintenance dates.")

    add_subheading_underlined("Non-Functional Requirements")
    add_paragraph("How well the module must do it:")
    add_bullet_point("Latitude validated between -90 and 90; longitude validated between -180 and 180.", "Geo Validation:")
    add_bullet_point("Highlights assets whose maintenance interval days have elapsed.", "Maintenance Alerts:")

    add_subheading_underlined("API Design")
    ast_api_headers = ["Method", "Endpoint", "Purpose / contract"]
    ast_api_rows = [
        ["GET", "/api/assets", "Fetches asset catalog with optional type, ward, and condition filters."],
        ["POST", "/api/assets", "Officer only. Registers a new public asset with GPS location."],
        ["PUT", "/api/assets/:id", "Updates asset health condition or logs maintenance entry."]
    ]
    add_table(ast_api_headers, ast_api_rows, col_widths=[1.0, 2.2, 3.3])

    add_subheading_underlined("DB Design")
    ast_db_headers = ["Collection", "Keys & indexes", "Key fields"]
    ast_db_rows = [
        ["assets", "_id, villageId, type, condition", "name, assetCode, type, ward, latitude, longitude, condition, estimatedValue, maintenanceIntervalDays, status"]
    ]
    add_table(ast_db_headers, ast_db_rows, col_widths=[1.5, 2.2, 2.8])

    add_subheading_underlined("Screenshots")
    add_paragraph("The screens below show the GIS public asset mapping interface and asset registry.")
    add_screenshot_placeholder("Fig 8.12", "Interactive GIS public asset and infrastructure map")
    add_screenshot_placeholder("Fig 8.13", "Village asset registry and maintenance scheduler")

    # 8.8 FINANCIAL TRANSACTIONS & BUDGETARY CONTROL
    add_section_heading("8.8 FINANCIAL TRANSACTIONS & BUDGETARY CONTROL")

    add_subheading_underlined("Purpose & Scope")
    add_paragraph("Enforces strict ledger accounting for village income receipts (government grants, local taxes) and expenditure payments against category-wise annual budgets.")

    add_subheading_underlined("Functional Requirements")
    add_paragraph("What the module must do:")
    add_bullet_point("Record receipts and expenditures with voucher reference numbers and descriptions.")
    add_bullet_point("Define annual category budgets (e.g. 2026-2027) with allocated, utilized, and remaining amounts.")
    add_bullet_point("Sequelize beforeSave hook auto-computes financial year from transaction date and recalculates remaining budget balances.")

    add_subheading_underlined("Non-Functional Requirements")
    add_paragraph("How well the module must do it:")
    add_bullet_point("Strict DECIMAL(14,2) representation for all monetary amounts.", "Zero Floating Error:")
    add_bullet_point("Prevents expenditure booking if category budget utilized amount exceeds allocated funds.", "Budget Guard:")

    add_subheading_underlined("API Design")
    ft_api_headers = ["Method", "Endpoint", "Purpose / contract"]
    ft_api_rows = [
        ["GET", "/api/financial-transactions", "Fetches financial transactions for a given financial year."],
        ["POST", "/api/financial-transactions", "Officer only. Records a new receipt or expenditure voucher."],
        ["GET", "/api/budgets", "Views category-wise budget allocations and utilization status."]
    ]
    add_table(ft_api_headers, ft_api_rows, col_widths=[1.0, 2.2, 3.3])

    add_subheading_underlined("DB Design")
    ft_db_headers = ["Collection", "Keys & indexes", "Key fields"]
    ft_db_rows = [
        ["financialTransactions", "_id, villageId, financialYear, type", "type, category, amount, referenceNumber, date, financialYear, status"],
        ["budgets", "_id, unique (villageId, financialYear, category)", "financialYear, category, allocatedAmount, utilizedAmount, remainingAmount"]
    ]
    add_table(ft_db_headers, ft_db_rows, col_widths=[1.5, 2.2, 2.8])

    add_subheading_underlined("Screenshots")
    add_paragraph("The screens below show the financial receipts/expenditures ledger and annual budget summary.")
    add_screenshot_placeholder("Fig 8.14", "Public financial ledger (Receipts & Expenditures)")
    add_screenshot_placeholder("Fig 8.15", "Annual budget allocation and utilization charts")

    # 8.9 GRAM SABHA MEETINGS & GOVERNANCE
    add_section_heading("8.9 GRAM SABHA MEETINGS & GOVERNANCE")

    add_subheading_underlined("Purpose & Scope")
    add_paragraph("Facilitates democratic local governance by managing public meeting schedules, formal agendas, public attendance logging, and official resolutions.")

    add_subheading_underlined("Functional Requirements")
    add_paragraph("What the module must do:")
    add_bullet_point("Schedule Gram Sabha, Panchayat Board, and Ward Sabha meetings with date, location, and published agenda items.")
    add_bullet_point("Document formal meeting minutes, passed resolutions, and gender-disaggregated public attendance counts (male/female/officials).")
    add_bullet_point("Publish public meeting notices accessible on citizen portals without login requirement.")

    add_subheading_underlined("Non-Functional Requirements")
    add_paragraph("How well the module must do it:")
    add_bullet_point("Meeting notices marked isPublic=true are publicly readable.", "Transparency:")
    add_bullet_point("Agenda items and meeting decisions are stored as structured JSON arrays.", "Structured Data:")

    add_subheading_underlined("API Design")
    m_api_headers = ["Method", "Endpoint", "Purpose / contract"]
    m_api_rows = [
        ["GET", "/api/meetings", "Fetches scheduled or completed meetings for the village."],
        ["POST", "/api/meetings", "Officer only. Schedules new Gram Sabha or Panchayat Board meeting."],
        ["PUT", "/api/meetings/:id", "Uploads meeting minutes, resolutions passed, and public attendance."]
    ]
    add_table(m_api_headers, m_api_rows, col_widths=[1.0, 2.2, 3.3])

    add_subheading_underlined("DB Design")
    m_db_headers = ["Collection", "Keys & indexes", "Key fields"]
    m_db_rows = [
        ["meetings", "_id, villageId, type, status", "title, type, date, location, agenda (JSON), minutes, decisions (JSON), attendance (JSON)"]
    ]
    add_table(m_db_headers, m_db_rows, col_widths=[1.5, 2.2, 2.8])

    add_subheading_underlined("Screenshots")
    add_paragraph("The screens below show the Gram Sabha meeting notice dashboard and attendance/minutes logger.")
    add_screenshot_placeholder("Fig 8.16", "Gram Sabha meeting schedule & notice dashboard")
    add_screenshot_placeholder("Fig 8.17", "Gram Sabha meeting resolutions & attendance logger")

    # 8.10 EXECUTIVE DASHBOARD, ANALYTICS & LOCALIZATION
    add_section_heading("8.10 EXECUTIVE DASHBOARD, ANALYTICS & LOCALIZATION")

    add_subheading_underlined("Purpose & Scope")
    add_paragraph("Provides operational transparency through live KPI summary monitoring, Recharts analytics graphics, and dynamic 8-language localization powered by Google Cloud Translation API.")

    add_subheading_underlined("Functional Requirements")
    add_paragraph("What the module must do:")
    add_bullet_point("Display active summary counters: total population, total works count, active budget utilization, asset count, and pending grievances.")
    add_bullet_point("Support dynamic UI translation across 8 Indian languages (English, Tamil, Hindi, Telugu, Kannada, Malayalam, Marathi, Bengali).")
    add_bullet_point("Hash source strings (SHA-256) and cache translated text in translationCache to eliminate redundant Google API calls.")

    add_subheading_underlined("Non-Functional Requirements")
    add_paragraph("How well the module must do it:")
    add_bullet_point("< 5 ms for cached translations vs ~300 ms for live API calls.", "Cache Latency:")
    add_bullet_point("If translation API key is unconfigured, UI safely displays original source text.", "Graceful Fallback:")

    add_subheading_underlined("API Design")
    loc_api_headers = ["Method", "Endpoint", "Purpose / contract"]
    loc_api_rows = [
        ["GET", "/api/health", "Public health check endpoint returning server & database status."],
        ["POST", "/api/translate", "Translates provided text or retrieves from DB cache for target language."]
    ]
    add_table(loc_api_headers, loc_api_rows, col_widths=[1.0, 2.2, 3.3])

    add_subheading_underlined("DB Design")
    loc_db_headers = ["Collection", "Keys & indexes", "Key fields"]
    loc_db_rows = [
        ["translationCache", "_id, unique sourceHash", "sourceHash, sourceText, sourceLanguage, targetLanguage, translatedText"]
    ]
    add_table(loc_db_headers, loc_db_rows, col_widths=[1.5, 2.2, 2.8])

    add_subheading_underlined("Screenshots")
    add_paragraph("The screens below show the executive analytics dashboard and dynamic multi-lingual interfaces.")
    add_screenshot_placeholder("Fig 8.18", "Executive analytics dashboard with KPI metrics")
    add_screenshot_placeholder("Fig 8.19", "Dynamic interface localized in Tamil")
    add_screenshot_placeholder("Fig 8.20", "Dynamic interface localized in Hindi")

    # ==================== CHAPTER 9: CONCLUSION & FUTURE WORK ====================
    add_heading_chapter(9, "CONCLUSION")

    add_subheading_underlined("CONCLUSION")
    add_paragraph("The E-GramSwaraj+ system provides a comprehensive, full-stack digital governance platform for automating and modernizing the core operations of South Thittankulam Village Panchayat. By unifying village profile administration, citizen service requisitions, multi-year development project lifecycle tracking, public physical asset management, financial budget accounting, and Gram Sabha governance within a single web application, the system successfully eliminates manual paper registers, minimizes recording errors, and significantly enhances public transparency.")

    add_paragraph("Developed using React 18, Vite, Tailwind CSS, Recharts, and Leaflet on the client side, and Node.js, Express.js, Sequelize ORM, and MySQL 8 on the server side, the platform exhibits high architectural performance, modular maintainability, and enterprise-grade security. Secured through JWT token authentication, salted bcrypt password hashing, HTTP hardening via Helmet, CORS restrictions, and express rate limiting, the system guarantees role-based access control across administrative officers, staff, and citizens.")

    add_paragraph("Furthermore, the integration of dynamic 8-language localization via Google Cloud Translation API backed by a high-speed SHA-256 database cache breaks down language barriers, enabling local villagers to interact seamlessly with their local panchayat portal in their native language. In conclusion, E-GramSwaraj+ demonstrates how modern web technologies can empower rural digital governance, providing a scalable model capable of extending to Panchayati Raj institutions across the nation.")

    add_subheading_underlined("FUTURE WORK")
    add_paragraph("In future, E-GramSwaraj+ can be improved by integrating real-time SMS and WhatsApp notifications for citizens upon grievance status changes and Gram Sabha meeting alerts. The system can be upgraded with automated GIS spatial boundary drawing tools for ward planning, mobile application versions for offline field data collection by village overseers, and AI-powered grievance auto-categorization using natural language processing. Finally, cloud-native deployments with auto-scaling database read replicas can enable multi-panchayat scaling across entire blocks and districts.")

    # Save document
    output_path = os.path.join(os.getcwd(), "E-GramSwaraj_Project_Report.docx")
    doc.save(output_path)
    print(f"Successfully generated project report at: {output_path}")

if __name__ == "__main__":
    create_document()
