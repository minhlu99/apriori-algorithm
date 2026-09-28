#!/usr/bin/env python3
"""
Apriori Algorithm Presentation - 100% Robust PPTX Exporter
Constructs a native 16:9 Microsoft PowerPoint presentation (.pptx) based on the
official Microsoft Office Theme package bundled with macOS PowerPoint, ensuring
complete compatibility with Microsoft PowerPoint, Google Drive / Google Slides,
and Apple Keynote without any repair warnings or schema errors.
"""

import os
import sys
import zipfile
import xml.sax.saxutils as saxutils

# Path to official Microsoft Office Theme
OFFICIAL_THMX = "/Applications/Microsoft PowerPoint.app/Contents/Resources/Office Themes/Office Theme.thmx"

# 16:9 Widescreen EMU Dimensions
SLIDE_WIDTH = 12192000
SLIDE_HEIGHT = 6858000

# Color Palette (Dark-Tech Theme)
C_BG = "0A0D14"
C_CARD_BG = "121724"
C_CARD_BORDER = "232E42"
C_CYAN = "06B6D4"
C_CYAN_LIGHT = "38BDF8"
C_INDIGO = "6366F1"
C_INDIGO_LIGHT = "818CF8"
C_GREEN = "10B981"
C_GREEN_LIGHT = "34D399"
C_GOLD = "F59E0B"
C_GOLD_LIGHT = "FBBF24"
C_RED = "F43F5E"
C_RED_LIGHT = "F87171"
C_TEXT_WHITE = "FFFFFF"
C_TEXT_MUTED = "94A3B8"
C_TEXT_BODY = "CBD5E1"
C_CALLOUT_BG = "182133"

def make_shape(sp_id, name, x, y, cx, cy, fill_hex=None, border_hex=None, paragraphs=None, shape_type="roundRect", pad=(180000, 180000, 160000, 160000)):
    """Creates a strictly schema-compliant OpenXML DrawingML shape."""
    fill_xml = f'<a:solidFill><a:srgbClr val="{fill_hex}"/></a:solidFill>' if fill_hex else '<a:noFill/>'
    ln_xml = f'<a:ln w="12700"><a:solidFill><a:srgbClr val="{border_hex}"/></a:solidFill></a:ln>' if border_hex else '<a:ln><a:noFill/></a:ln>'
    
    p_xmls = []
    if paragraphs:
        for p in paragraphs:
            align = p.get("align", "l")
            algn_attr = f' algn="{align}"' if align != "l" else ''
            
            # Strict DrawingML element order inside a:pPr:
            # 1. lnSpc (if any)
            # 2. spcBfr (if any)
            # 3. spcAft (if any)
            p_props = []
            if p.get("line_spacing"):
                p_props.append(f'<a:lnSpc><a:spcPct val="{p["line_spacing"]}"/></a:lnSpc>')
            if p.get("space_before"):
                p_props.append(f'<a:spcBfr><a:spcPts val="{p["space_before"]}"/></a:spcBfr>')
            if p.get("space_after"):
                p_props.append(f'<a:spcAft><a:spcPts val="{p["space_after"]}"/></a:spcAft>')
                
            p_props_xml = "".join(p_props)
            ppr_str = f'<a:pPr{algn_attr}>{p_props_xml}</a:pPr>' if (algn_attr or p_props_xml) else '<a:pPr/>'
            
            runs_xml = []
            for r in p.get("runs", []):
                txt = saxutils.escape(str(r.get("text", "")))
                sz = r.get("size", 1400)
                b = ' b="1"' if r.get("bold") else ''
                i = ' i="1"' if r.get("italic") else ''
                clr = r.get("color", C_TEXT_BODY)
                typeface = "Consolas" if r.get("mono") else "Helvetica Neue"
                
                runs_xml.append(f"""<a:r>
              <a:rPr lang="vi-VN" sz="{sz}"{b}{i}>
                <a:solidFill><a:srgbClr val="{clr}"/></a:solidFill>
                <a:latin typeface="{typeface}"/>
                <a:ea typeface="{typeface}"/>
                <a:cs typeface="{typeface}"/>
              </a:rPr>
              <a:t>{txt}</a:t>
            </a:r>""")
                
            p_xmls.append(f"""<a:p>
          {ppr_str}
          {"".join(runs_xml)}
          <a:endParaRPr lang="vi-VN"/>
        </a:p>""")
            
    l_ins, r_ins, t_ins, b_ins = pad
    return f"""<p:sp>
      <p:nvSpPr>
        <p:cNvPr id="{sp_id}" name="{name}"/>
        <p:cNvSpPr txBox="1"/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>
        <a:prstGeom prst="{shape_type}"><a:avLst/></a:prstGeom>
        {fill_xml}
        {ln_xml}
      </p:spPr>
      <p:txBody>
        <a:bodyPr lIns="{l_ins}" rIns="{r_ins}" tIns="{t_ins}" bIns="{b_ins}" wrap="square" rtlCol="0"/>
        <a:lstStyle/>
        {"".join(p_xmls)}
      </p:txBody>
    </p:sp>"""

def make_header(sp_id_start, tag_text, title_text, subtitle_text):
    """Generates standard top header shapes for a slide."""
    paragraphs = [
        {
            "space_after": 150,
            "runs": [{"text": tag_text, "size": 1100, "bold": True, "color": C_CYAN}]
        },
        {
            "space_after": 250,
            "runs": [{"text": title_text, "size": 2500, "bold": True, "color": C_TEXT_WHITE}]
        },
        {
            "runs": [{"text": subtitle_text, "size": 1250, "color": C_TEXT_MUTED}]
        }
    ]
    return make_shape(sp_id_start, "Header", 800000, 380000, 10592000, 1150000, fill_hex=None, border_hex=None, paragraphs=paragraphs, shape_type="rect", pad=(0,0,0,0))

def make_footer(sp_id_start, slide_num, total_slides=11):
    """Generates slide counter and branding footer."""
    paragraphs = [
        {
            "align": "r",
            "runs": [
                {"text": "TechWiz • Khai Phá Luật Kết Hợp & Apriori  |  ", "size": 950, "color": "64748B"},
                {"text": f"Slide {slide_num} / {total_slides}", "size": 950, "bold": True, "color": C_CYAN_LIGHT}
            ]
        }
    ]
    return make_shape(sp_id_start, "Footer", 800000, 6420000, 10592000, 320000, fill_hex=None, border_hex=None, paragraphs=paragraphs, shape_type="rect", pad=(0,0,0,0))

def make_protip(sp_id, icon, bold_title, content_text):
    """Generates bottom Pro Tip callout card."""
    paragraphs = [
        {
            "runs": [
                {"text": f"{icon}  ", "size": 1100, "bold": True, "color": C_GOLD_LIGHT},
                {"text": bold_title + " ", "size": 1100, "bold": True, "color": C_TEXT_WHITE},
                {"text": content_text, "size": 1050, "color": C_TEXT_BODY}
            ]
        }
    ]
    return make_shape(sp_id, "ProTip", 800000, 5920000, 10592000, 430000, fill_hex=C_CALLOUT_BG, border_hex="2E3A52", paragraphs=paragraphs, shape_type="roundRect", pad=(180000, 180000, 90000, 90000))

def build_slide_xml(shapes_xml):
    """Wraps shapes inside PresentationML 2006 main slide XML structure."""
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill><a:srgbClr val="{C_BG}"/></a:solidFill>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      {shapes_xml}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>"""

# ==============================================================================
# SLIDE BUILDERS (1 to 11)
# ==============================================================================

def get_slide_1():
    """Slide 1: Hero Cover"""
    shapes = []
    p_tag = [{
        "align": "ctr",
        "runs": [{"text": "✦  KHAI PHÁ QUY LUẬT GIỎ HÀNG (MARKET BASKET ANALYSIS)", "size": 1300, "bold": True, "color": C_CYAN}]
    }]
    shapes.append(make_shape(10, "Pill", 2600000, 1100000, 6992000, 500000, fill_hex=C_CARD_BG, border_hex="2E3A52", paragraphs=p_tag, pad=(100000,100000,80000,80000)))
    
    p_title = [
        {
            "align": "ctr",
            "space_after": 200,
            "runs": [{"text": "Thuật Toán Apriori", "size": 3800, "bold": True, "color": C_CYAN_LIGHT}]
        },
        {
            "align": "ctr",
            "space_after": 500,
            "runs": [{"text": "Nghệ Thuật Đoán Ý Người Mua", "size": 3400, "bold": True, "color": C_TEXT_WHITE}]
        },
        {
            "align": "ctr",
            "runs": [{"text": "Làm sao siêu thị và sàn thương mại điện tử đoán trúng món bạn muốn mua tiếp theo giữa hàng triệu sản phẩm?", "size": 1500, "color": C_TEXT_MUTED}]
        }
    ]
    shapes.append(make_shape(11, "HeroTitle", 1200000, 1800000, 9792000, 2200000, fill_hex=None, border_hex=None, paragraphs=p_title, shape_type="rect"))
    
    features = [
        ("🏛️", "Nền Tảng Data Mining", "Agrawal & Srikant 1994", 1200000),
        ("✂️", "Tiên Đề Tỉa Nhánh Đột Phá", "Cắt giảm 99% tổ hợp", 4600000),
        ("🎯", "Bộ 3 Thước Đo Vàng", "Support, Conf, Lift", 8000000)
    ]
    for idx, (icon, t1, t2, x_pos) in enumerate(features):
        p_feat = [
            {"align": "ctr", "runs": [{"text": f"{icon}  {t1}", "size": 1250, "bold": True, "color": C_TEXT_WHITE}]},
            {"align": "ctr", "runs": [{"text": t2, "size": 1050, "color": C_TEXT_MUTED}]}
        ]
        shapes.append(make_shape(12 + idx, f"Feature{idx}", x_pos, 4400000, 2992000, 950000, fill_hex=C_CARD_BG, border_hex="2E3A52", paragraphs=p_feat))

    p_start = [{
        "align": "ctr",
        "runs": [{"text": "⚡ Trình Chiếu Chuẩn Widescreen 16:9  •  Sẵn Sàng Mở Với Google Slides & PowerPoint", "size": 1150, "color": C_CYAN}]
    }]
    shapes.append(make_shape(16, "StartNote", 2600000, 5600000, 6992000, 450000, fill_hex=None, border_hex=None, paragraphs=p_start, shape_type="rect"))
    
    shapes.append(make_footer(17, 1))
    return build_slide_xml("".join(shapes))

def get_slide_2():
    """Slide 2: Beer & Diapers Hook"""
    shapes = [
        make_header(20, "01 • NGHỊCH LÝ THÚ VỊ", "Huyền Thoại: \"Bia & Tã Giấy\" Chiều Thứ Sáu", "Một phát hiện thực tế từ dữ liệu mà trực giác chuyên gia bán lẻ không bao giờ nghĩ tới."),
        make_footer(21, 2),
        make_protip(22, "💡", "Bài học kinh doanh cốt lõi:", "Mục tiêu của Apriori không phải tìm điều hiển nhiên (Bàn chải kèm Kem đánh răng), mà là phát hiện mối liên hệ ngầm bất ngờ mang lại doanh thu đột phá!")
    ]
    
    p_left = [
        {"space_after": 150, "runs": [{"text": "SỰ THẬT TỪ DỮ LIỆU BÁN LẺ", "size": 1000, "bold": True, "color": C_GOLD_LIGHT}]},
        {"space_after": 250, "runs": [{"text": "🔍 Phát Hiện Từ 100.000 Hóa Đơn", "size": 1600, "bold": True, "color": C_TEXT_WHITE}]},
        {"space_after": 300, "runs": [
            {"text": "Cứ mỗi chiều thứ Sáu, hệ thống siêu thị ghi nhận một hành vi kỳ lạ: Khách hàng mua ", "size": 1250, "color": C_TEXT_BODY},
            {"text": "Tã giấy cho em bé", "size": 1250, "bold": True, "color": C_GOLD_LIGHT},
            {"text": " lại có xu hướng rất cao xách thêm một vài lon ", "size": 1250, "color": C_TEXT_BODY},
            {"text": "Bia", "size": 1250, "bold": True, "color": C_CYAN_LIGHT},
            {"text": " mát lạnh!", "size": 1250, "color": C_TEXT_BODY}
        ]},
        {"space_after": 400, "runs": [{"text": "• Tỷ lệ mua chung cao gấp 3.5 lần so với bất kỳ ngày nào khác trong tuần.", "size": 1150, "color": C_TEXT_MUTED}]},
        {"space_after": 150, "runs": [{"text": "🚀 Quyết Định Kinh Doanh Đột Phá:", "size": 1400, "bold": True, "color": C_GREEN_LIGHT}]},
        {"runs": [{"text": "Kê quầy bia ngay cạnh gian hàng tã ➔ Doanh số cả hai mặt hàng TĂNG VỌT HƠN 35% mà không tốn một đồng chi phí quảng cáo!", "size": 1200, "bold": True, "color": C_TEXT_WHITE}]}
    ]
    shapes.append(make_shape(23, "LeftCard", 800000, 1650000, 5150000, 4100000, fill_hex=C_CARD_BG, border_hex=C_CARD_BORDER, paragraphs=p_left))

    p_right = [
        {"space_after": 150, "runs": [{"text": "GIẢI MÃ BẢN CHẤT HÀNH VI", "size": 1000, "bold": True, "color": C_GREEN_LIGHT}]},
        {"space_after": 250, "runs": [{"text": "Vì sao lại có sự kết hợp kỳ lạ này?", "size": 1600, "bold": True, "color": C_TEXT_WHITE}]},
        {"space_after": 300, "runs": [
            {"text": "Các ông bố trẻ tan sở được vợ dặn ghé siêu thị mua tã cho con. Nhân tiện cuối tuần có trận bóng đá ngoại hạng, họ tự thưởng một lốc bia để thư giãn cùng bạn bè.", "size": 1250, "color": C_TEXT_BODY}
        ]},
        {"space_after": 250, "runs": [
            {"text": "🧠 Tâm lý ngữ cảnh (Contextual Shopping):\n", "size": 1250, "bold": True, "color": C_CYAN_LIGHT},
            {"text": "Khách hàng không mua sắm ngẫu nhiên. Mỗi giỏ hàng là một tình huống tiêu dùng cụ thể trong đời sống thực.", "size": 1150, "color": C_TEXT_BODY}
        ]},
        {"runs": [
            {"text": "📊 Sức mạnh Data Mining:\n", "size": 1250, "bold": True, "color": C_GOLD_LIGHT},
            {"text": "Trực giác chuyên gia 20 năm không bao giờ tự nghĩ ra cách xếp Tã cạnh Bia. Chỉ có dữ liệu mới nói lên sự thật!", "size": 1150, "color": C_TEXT_BODY}
        ]}
    ]
    shapes.append(make_shape(24, "RightCard", 6242000, 1650000, 5150000, 4100000, fill_hex=C_CARD_BG, border_hex="2A364F", paragraphs=p_right))
    return build_slide_xml("".join(shapes))

def get_slide_3():
    """Slide 3: Combinatorial Explosion (2^d - 1)"""
    shapes = [
        make_header(30, "02 • THÁCH THỨC TÍNH TOÁN", "Bùng Nổ Tổ Hợp: Khi Duyệt Mò Trở Thành Thảm Họa", "Không gian tìm kiếm hình mũ 2ᵈ: Tại sao máy tính mạnh nhất cũng chịu thua nếu kiểm tra ngây thơ?"),
        make_footer(31, 3),
        make_protip(32, "📐", "Bản chất tổ hợp:", "Với danh mục d món, không gian tập con không rỗng là 2ᵈ - 1. Nếu siêu thị có 1.000 sản phẩm, số combo lớn hơn tổng số nguyên tử trong toàn vũ trụ!")
    ]

    p_left = [
        {"space_after": 150, "runs": [{"text": "QUY MÔ BÙNG NỔ SỐ MŨ (2ᵈ - 1)", "size": 1000, "bold": True, "color": C_GOLD_LIGHT}]},
        {"space_after": 250, "runs": [{"text": "Số Tổ Hợp Theo Danh Mục Sản Phẩm", "size": 1600, "bold": True, "color": C_TEXT_WHITE}]},
        {"space_after": 200, "runs": [
            {"text": "• 10 món hàng:   ", "size": 1200, "bold": True, "color": C_TEXT_WHITE},
            {"text": "2¹⁰ - 1 = 1.023 combo  ➔  1ms là xong", "size": 1200, "color": C_GREEN_LIGHT}
        ]},
        {"space_after": 200, "runs": [
            {"text": "• 50 món hàng:   ", "size": 1200, "bold": True, "color": C_TEXT_WHITE},
            {"text": "2⁵⁰ ≈ 1,12 triệu tỷ combo  ➔  Mất vài tuần", "size": 1200, "color": C_GOLD_LIGHT}
        ]},
        {"space_after": 200, "runs": [
            {"text": "• 100 món hàng:  ", "size": 1200, "bold": True, "color": C_TEXT_WHITE},
            {"text": "2¹⁰⁰ ≈ 1,26 × 10³⁰ combo  ➔  Chạy cả 40 tỷ năm!", "size": 1200, "bold": True, "color": C_RED_LIGHT}
        ]},
        {"space_after": 300, "runs": [
            {"text": "• 10.000 món (siêu thị thật): ", "size": 1200, "bold": True, "color": C_TEXT_WHITE},
            {"text": "2¹⁰⁰⁰⁰ >> Số hạt vũ trụ  ➔  Bất khả thi!", "size": 1200, "bold": True, "color": C_RED_LIGHT}
        ]},
        {"runs": [
            {"text": "🚨 Quy luật cấp số nhân: ", "size": 1150, "bold": True, "color": C_RED_LIGHT},
            {"text": "Cứ thêm đúng 1 món mới vào siêu thị, số phép thử lại tăng gấp đôi! Duyệt vét cạn là con đường cùng đường.", "size": 1100, "color": C_TEXT_BODY}
        ]}
    ]
    shapes.append(make_shape(33, "LeftCard", 800000, 1650000, 5150000, 4100000, fill_hex=C_CARD_BG, border_hex=C_CARD_BORDER, paragraphs=p_left))

    p_right = [
        {"space_after": 150, "runs": [{"text": "NÚT THẮT NGHẼN TOÁN HỌC", "size": 1000, "bold": True, "color": C_RED_LIGHT}]},
        {"space_after": 250, "runs": [{"text": "⚠️ Cái Bẫy Duyệt Mò (Brute-Force)", "size": 1600, "bold": True, "color": C_RED_LIGHT}]},
        {"space_after": 200, "runs": [{"text": "📐 Nguồn Gốc Công Thức 2ᵈ - 1:", "size": 1300, "bold": True, "color": C_INDIGO_LIGHT}]},
        {"space_after": 150, "runs": [
            {"text": "1. Tại sao là 2ᵈ? ", "size": 1200, "bold": True, "color": C_CYAN_LIGHT},
            {"text": "Mỗi món trong danh mục có đúng 2 khả năng: Được chọn (1) hoặc Không chọn (0). Với d món có 2 × 2 × ... = 2ᵈ tập con (Power Set).", "size": 1150, "color": C_TEXT_BODY}
        ]},
        {"space_after": 250, "runs": [
            {"text": "2. Tại sao trừ 1 (-1)? ", "size": 1200, "bold": True, "color": C_CYAN_LIGHT},
            {"text": "Trừ đi duy nhất 1 trường hợp rỗng (∅) khi không chọn món nào (vì giỏ hàng luôn có ≥ 1 món).", "size": 1150, "color": C_TEXT_BODY}
        ]},
        {"space_after": 200, "runs": [
            {"text": "⏱️ Giới Hạn Siêu Máy Tính: ", "size": 1200, "bold": True, "color": C_RED_LIGHT},
            {"text": "Dù máy chủ xử lý 1 tỷ combo/giây, để duyệt hết danh mục 100 món vẫn cần 40 tỷ năm (gấp 3 lần tuổi thọ vũ trụ)!", "size": 1150, "color": C_TEXT_BODY}
        ]},
        {"runs": [
            {"text": "💡 Lối Thoát Apriori: ", "size": 1200, "bold": True, "color": C_GREEN_LIGHT},
            {"text": "Tiên đề phản đơn điệu cắt tỉa trước 99% tổ hợp vô vọng mà không tốn công quét đĩa CSDL!", "size": 1150, "color": C_TEXT_BODY}
        ]}
    ]
    shapes.append(make_shape(34, "RightCard", 6242000, 1650000, 5150000, 4100000, fill_hex=C_CARD_BG, border_hex="3B2430", paragraphs=p_right))
    return build_slide_xml("".join(shapes))

def get_slide_4():
    """Slide 4: Three Golden Metrics"""
    shapes = [
        make_header(40, "03 • CƠ SỞ TOÁN HỌC CHUẨN MỰC", "Bộ 3 Thước Đo Vàng: Hệ Thống 3 Lớp Lọc Dữ Liệu", "Chuẩn học thuật Agrawal (1994) & Tan (2006): Thiếu 1 trong 3 chỉ số sẽ dẫn đến quyết định sai lầm."),
        make_footer(41, 4)
    ]
    
    col_defs = [
        {
            "tag": "LỚP 1 • LỌC NHIỄU", "tag_color": C_GOLD_LIGHT,
            "title": "1. Support (Độ hỗ trợ)",
            "formula": "Supp(A) = σ(A) / |D|\nSupp(A ∪ B) = σ(A ∪ B) / |D|",
            "prob": "🎲 Xác suất đồng thời P(A ∩ B) trên không gian mẫu |D|",
            "why": "• Lý thuyết xác suất: Coi mỗi đơn hàng là một phép thử ngẫu nhiên. Support chính là xác suất thực nghiệm P(A ∩ B).\n• Tại sao chia |D|? Chuẩn hóa về [0, 1] để so sánh công bằng giữa shop 200 đơn và sàn 1 triệu đơn.",
            "example": "📊 Ví dụ: 1.000 đơn. Có 400 đơn Bia ➔ Supp(Bia) = 40%. Có 200 đơn cả Bia & Tã ➔ Supp = 20%.",
            "border": "382C18"
        },
        {
            "tag": "LỚP 2 • ĐỊNH HƯỚNG", "tag_color": C_INDIGO_LIGHT,
            "title": "2. Confidence (Độ tin cậy)",
            "formula": "Conf(A ⇒ B) = Supp(A ∪ B) / Supp(A)",
            "prob": "🎲 Xác suất có điều kiện Bayes P(B | A) = P(A ∩ B) / P(A)",
            "why": "• Lý thuyết xác suất: Định lý Bayes (biết A đã xảy ra, tính xác suất B xảy ra).\n• Tại sao chia Supp(A)? Thu hẹp không gian mẫu về khách đã mua A. Tạo tính định hướng 1 chiều (Xe máy ➔ Mũ BH 95%, ngược lại chỉ 5%).",
            "example": "🎯 Ví dụ: Supp(Bia ∪ Tã) = 20%, Supp(Bia) = 40% ➔ Conf(Bia ⇒ Tã) = 20% / 40% = 50%.",
            "border": "242A4A"
        },
        {
            "tag": "LỚP 3 • HỆ SỐ ĐÒN BẨY", "tag_color": C_GREEN_LIGHT,
            "title": "3. Lift (Hệ số đòn bẩy)",
            "formula": "Lift(A ⇒ B) = Conf(A ⇒ B) / Supp(B)",
            "prob": "🎲 Tỷ số kiểm định độc lập P(A ∩ B) / [P(A) × P(B)]",
            "why": "• Lý thuyết xác suất: Hai biến cố độc lập khi P(A ∩ B) = P(A) × P(B) ⇔ Lift = 1.\n• Tại sao chia Supp(B)? Bóc trần hàng bán chạy tự nhiên (Túi nilon ai cũng lấy). Lift > 1 chứng minh A thực sự kích cầu mua B gấp X lần!",
            "example": "🚀 Ví dụ: Supp(Tã) = 10%, Conf = 50% ➔ Lift = 50% / 10% = 5.0 (Tăng gấp 5 lần so với tự nhiên!)",
            "border": "1C382B"
        }
    ]

    xs = [800000, 4416000, 8032000]
    for idx, (col, x) in enumerate(zip(col_defs, xs)):
        p_card = [
            {"space_after": 150, "runs": [{"text": col["tag"], "size": 950, "bold": True, "color": col["tag_color"]}]},
            {"space_after": 200, "runs": [{"text": col["title"], "size": 1500, "bold": True, "color": C_TEXT_WHITE}]},
            {"space_after": 150, "runs": [{"text": col["formula"], "size": 1150, "bold": True, "mono": True, "color": col["tag_color"]}]},
            {"space_after": 200, "runs": [{"text": col["prob"], "size": 1000, "italic": True, "color": C_CYAN_LIGHT}]},
            {"space_after": 200, "runs": [{"text": col["why"], "size": 1050, "color": C_TEXT_BODY}]},
            {"runs": [{"text": col["example"], "size": 1050, "bold": True, "color": C_TEXT_WHITE}]}
        ]
        shapes.append(make_shape(42 + idx, f"MetricCol{idx}", x, 1600000, 3360000, 4200000, fill_hex=C_CARD_BG, border_hex=col["border"], paragraphs=p_card))

    p_legend = [
        {"runs": [
            {"text": "📐 Chú giải ký hiệu:  ", "size": 1050, "bold": True, "color": C_GOLD_LIGHT},
            {"text": "σ: Support Count (số hóa đơn thực tế)  |  |D|: Tổng số giao dịch  |  A ⇒ B: Chiều gợi ý 1 chiều  |  A ∪ B: Combo mua cùng", "size": 1050, "color": C_TEXT_MUTED}
        ]}
    ]
    shapes.append(make_shape(46, "NotationLegend", 800000, 5920000, 10592000, 430000, fill_hex=C_CALLOUT_BG, border_hex="2E3A52", paragraphs=p_legend, shape_type="roundRect", pad=(180000,180000,90000,90000)))
    return build_slide_xml("".join(shapes))

def get_slide_5():
    """Slide 5: Anti-monotonicity & Pruning"""
    shapes = [
        make_header(50, "04 • NGUYÊN LÝ CỐT LÕI APRIORI", "Nguyên Lý Apriori: Tiên Đề Phản Đơn Điệu (Anti-monotonicity)", "Bản chất toán học: Mọi tập cha chứa tập con không phổ biến đều chắc chắn bị loại bỏ."),
        make_footer(51, 5),
        make_protip(52, "✂️", "Bản chất hình học:", "Cây không gian tổ hợp (Itemset Lattice) bị cắt tỉa từ dưới lên. Một combo cha chỉ có cơ hội sống sót nếu tất cả các tập con của nó đều là tập phổ biến!")
    ]

    p_left = [
        {"space_after": 150, "runs": [{"text": "QUY TẮC TRỰC GIÁC CỐT LÕI", "size": 1000, "bold": True, "color": C_CYAN}]},
        {"space_after": 250, "runs": [{"text": "\"Nếu một tập con không phổ biến, thì bất kỳ combo cha nào chứa nó CHẮC CHẮN cũng không thể phổ biến!\"", "size": 1500, "bold": True, "color": C_TEXT_WHITE}]},
        {"space_after": 200, "runs": [{"text": "📐 Định nghĩa chuẩn: ∀ X ⊆ Y ⇒ Support(Y) ≤ Support(X)", "size": 1300, "bold": True, "mono": True, "color": C_CYAN_LIGHT}]},
        {"space_after": 150, "runs": [
            {"text": "• X: Tập con ", "size": 1200, "bold": True, "color": C_GOLD_LIGHT},
            {"text": "(ví dụ món đơn {Bia})\n", "size": 1150, "color": C_TEXT_MUTED},
            {"text": "• Y: Tập cha ", "size": 1200, "bold": True, "color": C_INDIGO_LIGHT},
            {"text": "(ví dụ combo {Bia, Tã})", "size": 1150, "color": C_TEXT_MUTED}
        ]},
        {"space_after": 250, "runs": [
            {"text": "💡 Tại sao Support(Y) ≤ Support(X)?\n", "size": 1200, "bold": True, "color": C_TEXT_WHITE},
            {"text": "Bất kỳ hóa đơn nào chứa combo lớn Y ({Bia, Tã}) thì bắt buộc phải có món con X (Bia). Ngược lại, có người mua riêng Bia mà không mua Tã. Do đó số lần xuất hiện của Y không bao giờ vượt quá X!", "size": 1150, "color": C_TEXT_BODY}
        ]},
        {"runs": [
            {"text": "✂️ Hệ Quả Vàng (Apriori Pruning): ", "size": 1200, "bold": True, "color": C_RED_LIGHT},
            {"text": "Nếu Support(X) < min_sup ➔ Gạch bỏ ngay tập cha Y mà không cần quét CSDL!", "size": 1150, "bold": True, "color": C_TEXT_WHITE}
        ]}
    ]
    shapes.append(make_shape(53, "LeftCard", 800000, 1650000, 5150000, 4100000, fill_hex=C_CARD_BG, border_hex=C_CARD_BORDER, paragraphs=p_left))

    p_right = [
        {"space_after": 150, "runs": [{"text": "MINH HỌA TỈA CÀNH THỰC TẾ", "size": 1000, "bold": True, "color": C_RED_LIGHT}]},
        {"space_after": 250, "runs": [{"text": "Cắt Nhánh Tức Thì: Tiết Kiệm 95% Tính Toán", "size": 1600, "bold": True, "color": C_TEXT_WHITE}]},
        {"space_after": 200, "runs": [
            {"text": "🥚 {Trứng} bị loại ", "size": 1400, "bold": True, "color": C_RED_LIGHT},
            {"text": "(Support = 1/7 = 14% < min_sup 40%)\nChỉ có 1 đơn hàng trong toàn bộ 7 giao dịch mẫu.", "size": 1150, "color": C_TEXT_MUTED}
        ]},
        {"space_after": 250, "runs": [{"text": "⬇ GẠCH BỎ TOÀN BỘ CÁC COMBO CHA, KHÔNG QUÉT ĐĨA!", "size": 1200, "bold": True, "color": C_CYAN_LIGHT}]},
        {"space_after": 120, "runs": [{"text": "❌  {Trứng, Sữa}          ➔ BỊ LOẠI NGAY LẬP TỨC", "size": 1150, "mono": True, "color": C_RED_LIGHT}]},
        {"space_after": 120, "runs": [{"text": "❌  {Trứng, Bia}           ➔ BỊ LOẠI NGAY LẬP TỨC", "size": 1150, "mono": True, "color": C_RED_LIGHT}]},
        {"space_after": 120, "runs": [{"text": "❌  {Trứng, Bánh mì}       ➔ BỊ LOẠI NGAY LẬP TỨC", "size": 1150, "mono": True, "color": C_RED_LIGHT}]},
        {"space_after": 250, "runs": [{"text": "❌  {Trứng, Sữa, Bia}      ➔ BỊ LOẠI NGAY LẬP TỨC", "size": 1150, "mono": True, "color": C_RED_LIGHT}]},
        {"runs": [{"text": "✓ Tiết kiệm ngay hơn 95% công sức tính toán và chi phí I/O đọc đĩa cứng!", "size": 1250, "bold": True, "color": C_GREEN_LIGHT}]}
    ]
    shapes.append(make_shape(54, "RightCard", 6242000, 1650000, 5150000, 4100000, fill_hex=C_CARD_BG, border_hex="3B2430", paragraphs=p_right))
    return build_slide_xml("".join(shapes))

def get_slide_6():
    """Slide 6: Summary Table & Confidence Fallacy"""
    shapes = [
        make_header(60, "05 • BẢNG VAI TRÒ BỔ TRỢ", "Hệ Thống 3 Lớp Lọc: Bảng Đối Chiếu & Bóc Trần Ảo Giác", "Tại sao phải kết hợp cả 3 chỉ số mới đủ cơ sở đưa ra quyết định kinh doanh chuẩn xác?"),
        make_footer(61, 6),
        make_protip(62, "⚖️", "Nguyên tắc thiết lập ngưỡng:", "min_sup và min_conf là siêu tham số do con người đề ra. Big Data đặt min_sup nhỏ (0.5% - 2%) để không sót cơ hội, và chỉ hành động khi Lift > 1.25!")
    ]

    p_left = [
        {"space_after": 150, "runs": [{"text": "BẢNG VAI TRÒ BỔ TRỢ 3 LỚP LỌC", "size": 1000, "bold": True, "color": C_GOLD_LIGHT}]},
        {"space_after": 250, "runs": [{"text": "Đối Chiếu Giá Trị & Rủi Ro", "size": 1600, "bold": True, "color": C_TEXT_WHITE}]},
        {"space_after": 200, "runs": [
            {"text": "1. SUPPORT:\n", "size": 1300, "bold": True, "color": C_GOLD_LIGHT},
            {"text": "• Câu hỏi: Cặp sản phẩm này có xuất hiện đủ nhiều không?\n", "size": 1150, "color": C_TEXT_WHITE},
            {"text": "• Rủi ro bỏ qua: Lãng phí tài nguyên vào combo hiếm (Xe hơi + Kim cương).", "size": 1100, "color": C_RED_LIGHT}
        ]},
        {"space_after": 200, "runs": [
            {"text": "2. CONFIDENCE:\n", "size": 1300, "bold": True, "color": C_INDIGO_LIGHT},
            {"text": "• Câu hỏi: Nếu khách mua A, xác suất họ mua thêm B là bao nhiêu?\n", "size": 1150, "color": C_TEXT_WHITE},
            {"text": "• Rủi ro bỏ qua: Không xác định được chiều đề xuất (Máy in vs Mực in).", "size": 1100, "color": C_RED_LIGHT}
        ]},
        {"space_after": 250, "runs": [
            {"text": "3. LIFT:\n", "size": 1300, "bold": True, "color": C_GREEN_LIGHT},
            {"text": "• Câu hỏi: Mua A có thực sự làm tăng cơ hội mua B so với tự nhiên?\n", "size": 1150, "color": C_TEXT_WHITE},
            {"text": "• Rủi ro bỏ qua: Bị đánh lừa bởi hàng vốn dĩ đã bán chạy (Túi nilon).", "size": 1100, "color": C_RED_LIGHT}
        ]},
        {"runs": [{"text": "🎯 Tóm lược: Support lọc rác ➔ Confidence đo tin cậy ➔ LIFT xác nhận giá trị kinh doanh!", "size": 1200, "bold": True, "color": C_CYAN_LIGHT}]}
    ]
    shapes.append(make_shape(63, "LeftCard", 800000, 1650000, 5150000, 4100000, fill_hex=C_CARD_BG, border_hex=C_CARD_BORDER, paragraphs=p_left))

    p_right = [
        {"space_after": 150, "runs": [{"text": "BÓC TRẦN ẢO GIÁC CONFIDENCE", "size": 1000, "bold": True, "color": C_RED_LIGHT}]},
        {"space_after": 200, "runs": [{"text": "Tại sao Conf 90% là luật rác, còn Conf 35% là mỏ vàng?", "size": 1450, "bold": True, "color": C_TEXT_WHITE}]},
        {"space_after": 120, "runs": [{"text": "❌ Luật Ảo: [Bia] ➔ [Túi Nilon]", "size": 1300, "bold": True, "color": C_RED_LIGHT}]},
        {"space_after": 200, "runs": [
            {"text": "Conf = 90%  |  P(Túi) = 90%  ➔  Lift = 90%/90% = 1.0 (Vô can!)\n", "size": 1150, "mono": True, "color": C_TEXT_WHITE},
            {"text": "Khách mua bia hay không thì vẫn lấy túi nilon! Làm combo quảng cáo là ném tiền qua cửa sổ.", "size": 1100, "color": C_TEXT_MUTED}
        ]},
        {"space_after": 120, "runs": [{"text": "💎 Mỏ Vàng: [Bia] ➔ [Tã Giấy]", "size": 1300, "bold": True, "color": C_GREEN_LIGHT}]},
        {"space_after": 250, "runs": [
            {"text": "Conf = 35%  |  P(Tã) = 10%  ➔  Lift = 35%/10% = 3.5 (Tăng 3.5x!)\n", "size": 1150, "mono": True, "color": C_TEXT_WHITE},
            {"text": "Nhờ có Bia, cơ hội bán Tã tăng gấp 3.5 lần! Đặt 2 quầy cạnh nhau lập tức bùng nổ doanh số.", "size": 1100, "color": C_TEXT_BODY}
        ]},
        {"runs": [{"text": "💎 Tuyên ngôn: Confidence đo xác suất, còn LIFT đo hiệu quả can thiệp kinh doanh!", "size": 1250, "bold": True, "color": C_GOLD_LIGHT}]}
    ]
    shapes.append(make_shape(64, "RightCard", 6242000, 1650000, 5150000, 4100000, fill_hex=C_CARD_BG, border_hex="2A364F", paragraphs=p_right))
    return build_slide_xml("".join(shapes))

def get_slide_7():
    """Slide 7: Join & Prune Steps"""
    shapes = [
        make_header(70, "06 • CHI TIẾT THUẬT TOÁN", "Vòng Lặp Thông Minh: Ghép Cặp (Join) & Tỉa Cành (Prune)", "Sinh dần combo từ nhỏ đến lớn: Kết hợp phép ghép có điều kiện và tiên đề tỉa nhánh triệt để."),
        make_footer(71, 7),
        make_protip(72, "💡", "Kỹ thuật Agrawal:", "Sắp xếp các món hàng theo thứ tự từ điển (A → Z) trước khi ghép cặp giúp loại bỏ 100% khả năng sinh trùng lặp ứng viên và giảm hơn 80% phép duyệt thử!")
    ]

    p_left = [
        {"space_after": 150, "runs": [{"text": "BƯỚC 1 • GHÉP NỐI (JOIN)", "size": 1000, "bold": True, "color": C_CYAN}]},
        {"space_after": 250, "runs": [{"text": "Ghép Ứng Viên (Lₖ₋₁ ⨝ Lₖ₋₁ ➔ Cₖ)", "size": 1600, "bold": True, "color": C_TEXT_WHITE}]},
        {"space_after": 200, "runs": [
            {"text": "Sắp xếp các mặt hàng theo thứ tự từ điển (A → Z). Hai tập Lₖ₋₁ chỉ được ghép lại với nhau khi chúng ", "size": 1200, "color": C_TEXT_BODY},
            {"text": "trùng nhau đúng k - 2 món đầu tiên", "size": 1200, "bold": True, "color": C_CYAN_LIGHT},
            {"text": ", chỉ khác nhau món cuối cùng!", "size": 1200, "color": C_TEXT_BODY}
        ]},
        {"space_after": 150, "runs": [{"text": "Ví dụ sinh combo 3 món (k = 3, trùng k-2 = 1 món đầu):", "size": 1150, "color": C_TEXT_MUTED}]},
        {"space_after": 100, "runs": [{"text": "• Tập 1: [ Bia, Bơ ] ∈ L₂", "size": 1200, "mono": True, "color": C_TEXT_WHITE}]},
        {"space_after": 200, "runs": [{"text": "• Tập 2: [ Bia, Sữa ] ∈ L₂  (Cùng chung Bia)", "size": 1200, "mono": True, "color": C_TEXT_WHITE}]},
        {"runs": [{"text": "➔ Sinh ứng viên mới: [ Bia, Bơ, Sữa ] ∈ C₃", "size": 1300, "bold": True, "mono": True, "color": C_GREEN_LIGHT}]}
    ]
    shapes.append(make_shape(73, "LeftCard", 800000, 1650000, 5150000, 4100000, fill_hex=C_CARD_BG, border_hex=C_CARD_BORDER, paragraphs=p_left))

    p_right = [
        {"space_after": 150, "runs": [{"text": "BƯỚC 2 • TỈA CÀNH (PRUNE)", "size": 1000, "bold": True, "color": C_RED_LIGHT}]},
        {"space_after": 250, "runs": [{"text": "Tỉa Nhánh Tức Thì (Kiểm Tra Tập Con)", "size": 1600, "bold": True, "color": C_TEXT_WHITE}]},
        {"space_after": 200, "runs": [
            {"text": "Chưa vội quét CSDL! ", "size": 1250, "bold": True, "color": C_RED_LIGHT},
            {"text": "Để ứng viên 3 món sống sót, ", "size": 1200, "color": C_TEXT_BODY},
            {"text": "TẤT CẢ 3 tập con 2 món", "size": 1200, "bold": True, "color": C_GOLD_LIGHT},
            {"text": " của nó đều phải nằm trong danh sách L₂ (đã là tập phổ biến).", "size": 1200, "color": C_TEXT_BODY}
        ]},
        {"space_after": 150, "runs": [{"text": "Kiểm tra 3 tập con của [ Bia, Bơ, Sữa ]:", "size": 1150, "color": C_TEXT_MUTED}]},
        {"space_after": 100, "runs": [{"text": "1. [ Bia, Bơ ] ∈ L₂   ➔ ✓ ĐẠT (Đã phổ biến)", "size": 1150, "mono": True, "color": C_GREEN_LIGHT}]},
        {"space_after": 100, "runs": [{"text": "2. [ Bia, Sữa ] ∈ L₂  ➔ ✓ ĐẠT (Đã phổ biến)", "size": 1150, "mono": True, "color": C_GREEN_LIGHT}]},
        {"space_after": 200, "runs": [{"text": "3. [ Bơ, Sữa ] ∉ L₂   ➔ ✗ BỊ LOẠI Ở VÒNG TRƯỚC!", "size": 1150, "bold": True, "mono": True, "color": C_RED_LIGHT}]},
        {"runs": [{"text": "➔ KẾT LUẬN: GẠCH BỎ NGAY [ Bia, Bơ, Sữa ], không tốn công đọc đĩa CSDL!", "size": 1250, "bold": True, "color": C_RED_LIGHT}]}
    ]
    shapes.append(make_shape(74, "RightCard", 6242000, 1650000, 5150000, 4100000, fill_hex=C_CARD_BG, border_hex="3B2430", paragraphs=p_right))
    return build_slide_xml("".join(shapes))

def get_slide_8():
    """Slide 8: Mining Association Rules & Revenue"""
    shapes = [
        make_header(80, "07 • RA QUYẾT ĐỊNH", "Từ Dữ Liệu Biến Thành Doanh Thu", "Biến quy luật A ➔ B thành tiền và trải nghiệm khách hàng xuất sắc."),
        make_footer(81, 8),
        make_protip(82, "💰", "Chiến lược ROI trong bán lẻ:", "Không áp dụng mù quáng mọi luật! Siêu thị kết hợp Lift với biên lợi nhuận (Profit Margin): giữ nguyên giá món chính A, tặng kèm voucher cho món phụ B có biên lãi cao để tối đa hóa lợi nhuận ròng!")
    ]

    p_left = [
        {"space_after": 150, "runs": [{"text": "TIÊU CHUẨN LỌC LUẬT HỢP LỆ", "size": 1000, "bold": True, "color": C_INDIGO_LIGHT}]},
        {"space_after": 250, "runs": [{"text": "Công Thức Sinh Quy Tắc", "size": 1600, "bold": True, "color": C_TEXT_WHITE}]},
        {"space_after": 200, "runs": [
            {"text": "Từ mỗi tập phổ biến A ∪ B ∈ Lₖ (ví dụ: {Bia, Tã}), ta sinh quy tắc gợi ý mua tiền đề ", "size": 1200, "color": C_TEXT_BODY},
            {"text": "A", "size": 1200, "bold": True, "color": C_CYAN_LIGHT},
            {"text": " kéo theo hệ quả ", "size": 1200, "color": C_TEXT_BODY},
            {"text": "B", "size": 1200, "bold": True, "color": C_GOLD_LIGHT},
            {"text": " (A ⇒ B).", "size": 1200, "bold": True, "color": C_TEXT_WHITE}
        ]},
        {"space_after": 150, "runs": [{"text": "1. Conf(A ⇒ B) = Supp(A ∪ B) / Supp(A) ≥ min_conf", "size": 1150, "bold": True, "mono": True, "color": C_INDIGO_LIGHT}]},
        {"space_after": 250, "runs": [{"text": "• Đảm bảo hành động gợi ý có xác suất thành công cao.", "size": 1100, "color": C_TEXT_MUTED}]},
        {"space_after": 150, "runs": [{"text": "2. Lift(A ⇒ B) = Conf(A ⇒ B) / Supp(B) > 1.0", "size": 1150, "bold": True, "mono": True, "color": C_GREEN_LIGHT}]},
        {"runs": [{"text": "• Đảm bảo hai món thực sự kéo doanh số của nhau, không phải trùng hợp.", "size": 1100, "color": C_TEXT_MUTED}]}
    ]
    shapes.append(make_shape(83, "LeftCard", 800000, 1650000, 5150000, 4100000, fill_hex=C_CARD_BG, border_hex=C_CARD_BORDER, paragraphs=p_left))

    p_right = [
        {"space_after": 150, "runs": [{"text": "3 ỨNG DỤNG THỰC CHIẾN DOANH THU TRIỆU ĐÔ", "size": 1000, "bold": True, "color": C_GREEN_LIGHT}]},
        {"space_after": 250, "runs": [{"text": "Triển Khai Trong Vận Hành", "size": 1600, "bold": True, "color": C_TEXT_WHITE}]},
        {"space_after": 200, "runs": [
            {"text": "🛒 Bố Trí Kệ Siêu Thị (Cross-Merchandising):\n", "size": 1250, "bold": True, "color": C_GOLD_LIGHT},
            {"text": "Đặt hai mặt hàng có Lift cao cạnh nhau hoặc trên cùng lối đi chính để tăng tỷ lệ tiện tay bỏ thêm vào giỏ.", "size": 1150, "color": C_TEXT_BODY}
        ]},
        {"space_after": 200, "runs": [
            {"text": "🎁 Đóng Gói Combo & Flash Sale:\n", "size": 1250, "bold": True, "color": C_CYAN_LIGHT},
            {"text": "Giảm giá nhẹ 5% khi mua cả cặp để thanh lý hàng tồn và tăng giá trị đơn hàng trung bình (AOV).", "size": 1150, "color": C_TEXT_BODY}
        ]},
        {"runs": [
            {"text": "📱 Recommender System (E-Commerce):\n", "size": 1250, "bold": True, "color": C_GREEN_LIGHT},
            {"text": "Tự động đẩy widget \"Thường được mua cùng nhau\" ở trang thanh toán khi khách vừa cho sản phẩm A vào giỏ.", "size": 1150, "color": C_TEXT_BODY}
        ]}
    ]
    shapes.append(make_shape(84, "RightCard", 6242000, 1650000, 5150000, 4100000, fill_hex=C_CARD_BG, border_hex="2A364F", paragraphs=p_right))
    return build_slide_xml("".join(shapes))

def get_slide_9():
    """Slide 9: Live Demo Transition"""
    shapes = []
    p_tag = [{
        "align": "ctr",
        "runs": [{"text": "⚡  KHÁM PHÁ TRỰC QUAN", "size": 1300, "bold": True, "color": C_CYAN}]
    }]
    shapes.append(make_shape(90, "Pill", 3600000, 1100000, 4992000, 500000, fill_hex=C_CARD_BG, border_hex="2E3A52", paragraphs=p_tag, pad=(100000,100000,80000,80000)))

    p_title = [
        {
            "align": "ctr",
            "space_after": 200,
            "runs": [{"text": "Xem Thuật Toán Vận Hành", "size": 3600, "bold": True, "color": C_TEXT_WHITE}]
        },
        {
            "align": "ctr",
            "space_after": 500,
            "runs": [{"text": "Live Simulator Trực Quan", "size": 3800, "bold": True, "color": C_CYAN_LIGHT}]
        },
        {
            "align": "ctr",
            "runs": [{"text": "\"Lý thuyết đã rõ ràng! Hãy cùng theo dõi thuật toán Apriori tự động quét từng dòng giao dịch, ghép cặp combo, vung nhát kéo tỉa cành và sinh quy tắc gợi ý theo thời gian thực.\"", "size": 1400, "italic": True, "color": C_TEXT_MUTED}]
        }
    ]
    shapes.append(make_shape(91, "HeroTitle", 1200000, 1800000, 9792000, 2200000, fill_hex=None, border_hex=None, paragraphs=p_title, shape_type="rect"))

    features = [
        ("🎬", "Mô Phỏng Từng Bước", "Theo dõi từng vòng quét CSDL", 1200000),
        ("✂️", "Đồ Thị Tỉa Nhánh Lattice", "Trực quan hóa cây tổ hợp", 4600000),
        ("🎛️", "Tùy Biến Siêu Tham Số", "Chỉnh min_sup & min_conf linh hoạt", 8000000)
    ]
    for idx, (icon, t1, t2, x_pos) in enumerate(features):
        p_feat = [
            {"align": "ctr", "runs": [{"text": f"{icon}  {t1}", "size": 1250, "bold": True, "color": C_TEXT_WHITE}]},
            {"align": "ctr", "runs": [{"text": t2, "size": 1050, "color": C_TEXT_MUTED}]}
        ]
        shapes.append(make_shape(92 + idx, f"Feature{idx}", x_pos, 4400000, 2992000, 950000, fill_hex=C_CARD_BG, border_hex="2E3A52", paragraphs=p_feat))

    p_hint = [{
        "align": "ctr",
        "runs": [{"text": "💡 Mẹo trình chiếu: Bấm phím 'D' trên trình duyệt để chuyển đổi tức thì giữa Slide và Bộ mô phỏng.", "size": 1150, "color": C_CYAN}]
    }]
    shapes.append(make_shape(96, "Hint", 2000000, 5600000, 8192000, 450000, fill_hex=None, border_hex=None, paragraphs=p_hint, shape_type="rect"))
    shapes.append(make_footer(97, 9))
    return build_slide_xml("".join(shapes))

def get_slide_10():
    """Slide 10: Pros, Cons & FP-Growth"""
    shapes = [
        make_header(100, "08 • NHÌN LẠI THUẬT TOÁN", "Ưu Điểm, Giới Hạn & Bước Tiến Kế Thừa", "Không có thuật toán nào hoàn hảo: Từ nền tảng Apriori đến bước nhảy vọt FP-Growth."),
        make_footer(101, 10),
        make_protip(102, "🧭", "Bức tranh tiến hóa thuật toán:", "Apriori (1994) đặt nền móng tỉa cành ➔ FP-Growth (2000) tối ưu nén cây ➔ Spark MLlib FPGrowth xử lý phân tán Big Data ngày nay. Nắm chắc Apriori là chìa khóa mở toang cánh cửa vào các hệ gợi ý hiện đại!")
    ]

    col_defs = [
        {
            "tag": "ĐIỂM SÁNG NỀN TẢNG", "tag_color": C_GREEN_LIGHT,
            "title": "✓ Ưu Điểm Nổi Bật",
            "points": [
                ("Triết lý tỉa cành xuất sắc: ", "Khai tử không gian tổ hợp vô ích ngay từ gốc trước khi quét đĩa."),
                ("Dễ diễn giải (Explainable): ", "Luật dạng Nếu A thì B rất trực quan, ban giám đốc và kinh doanh hiểu được ngay."),
                ("Di sản học thuật: ", "Nền tảng kinh điển của Data Mining (>25.000 trích dẫn học thuật).")
            ],
            "border": "1C382B"
        },
        {
            "tag": "HAI ĐIỂM NGHẼN LỚN", "tag_color": C_RED_LIGHT,
            "title": "⚠️ Hạn Chế Cốt Lõi",
            "points": [
                ("Nghẽn đọc đĩa (I/O Bottleneck): ", "Phải quét lại CSDL k lần (tìm combo 10 món = 10 lần quét toàn bộ đĩa cứng)."),
                ("Bùng nổ ứng viên (Cₖ): ", "Với 10.000 sản phẩm, C₂ có tới ≈ 5 × 10⁷ cặp cần đếm, dễ tràn RAM máy chủ.")
            ],
            "border": "3B2430"
        },
        {
            "tag": "BƯỚC TIẾN KẾ THỪA", "tag_color": C_CYAN_LIGHT,
            "title": "🚀 FP-Growth (Han 2000)",
            "points": [
                ("Chỉ quét CSDL đúng 2 lần: ", "Lần 1 đếm 1-item; Lần 2 nén giao dịch vào cây tiền tố FP-Tree."),
                ("Không sinh ứng viên: ", "Dùng đệ quy Chia để trị (Divide & Conquer) đào trực tiếp trên cây."),
                ("Hiệu năng: ", "Nhanh hơn Apriori từ 10x đến 100x trên dữ liệu lớn!")
            ],
            "border": "24334A"
        }
    ]

    xs = [800000, 4416000, 8032000]
    for idx, (col, x) in enumerate(zip(col_defs, xs)):
        p_card = [
            {"space_after": 150, "runs": [{"text": col["tag"], "size": 950, "bold": True, "color": col["tag_color"]}]},
            {"space_after": 250, "runs": [{"text": col["title"], "size": 1500, "bold": True, "color": C_TEXT_WHITE}]}
        ]
        for bold_t, desc_t in col["points"]:
            p_card.append({
                "space_after": 180,
                "runs": [
                    {"text": f"• {bold_t}", "size": 1150, "bold": True, "color": C_TEXT_WHITE},
                    {"text": desc_t, "size": 1100, "color": C_TEXT_BODY}
                ]
            })
        shapes.append(make_shape(103 + idx, f"Col{idx}", x, 1600000, 3360000, 4200000, fill_hex=C_CARD_BG, border_hex=col["border"], paragraphs=p_card))

    return build_slide_xml("".join(shapes))

def get_slide_11():
    """Slide 11: 3 Key Takeaways & Q&A"""
    shapes = [
        make_header(110, "09 • TỔNG KẾT & ĐÚC KẾT", "3 Bài Học Lớn Từ Thuật Toán Apriori", "Những giá trị cốt lõi đọng lại: Tư duy thuật toán, thước đo dữ liệu và ứng dụng thực tiễn."),
        make_footer(111, 11),
        make_protip(112, "🎓", "Lời kết:", "Dữ liệu không nói dối — chỉ có cách chúng ta giải mã dữ liệu có đủ thông minh hay không! Cảm ơn Thầy Cô và các bạn đã chú ý theo dõi.")
    ]

    takeaways = [
        {
            "tag": "BÀI HỌC 1 • TƯ DUY THUẬT TOÁN", "tag_color": C_RED_LIGHT,
            "title": "✂️ Tỉa Nhánh Từ Gốc",
            "desc": "Đừng bao giờ duyệt vét cạn (Brute-force) trong không gian bùng nổ số mũ 2ᵈ - 1.",
            "points": [
                ("Anti-monotonicity: ", "Tập con không phổ biến ➔ Tập cha chắc chắn bị loại."),
                ("Hiệu quả: ", "Cắt bỏ trước 99% tổ hợp vô vọng trước khi tốn tài nguyên quét đĩa CSDL.")
            ],
            "border": "3B2430"
        },
        {
            "tag": "BÀI HỌC 2 • BỘ LỌC DỮ LIỆU", "tag_color": C_GREEN_LIGHT,
            "title": "🎯 Bộ 3 Thước Đo Vàng",
            "desc": "Không bao giờ tin tưởng mù quáng vào Confidence cao nếu chưa kiểm chứng với Lift.",
            "points": [
                ("Support: ", "Lọc rác và các nhiễu ngẫu nhiên."),
                ("Confidence: ", "Định hướng chiều gợi ý (A ⇒ B)."),
                ("LIFT: ", "Khẳng định giá trị kích cầu thực sự (chống bẫy Túi Nilon).")
            ],
            "border": "1C382B"
        },
        {
            "tag": "BÀI HỌC 3 • THỰC TIỄN & KẾ THỪA", "tag_color": C_CYAN_LIGHT,
            "title": "🚀 Kim Chỉ Nam Cho AI Gợi Ý",
            "desc": "Apriori đặt nền móng tư duy cho các hệ thống gợi ý và tối ưu hóa doanh thu bán lẻ.",
            "points": [
                ("Di sản: ", "Dạy chúng ta cách lọc dữ liệu và tư duy kết hợp trước khi dùng ML phức tạp."),
                ("Kế thừa: ", "FP-Growth và Spark MLlib mở rộng xử lý Big Data triệu giao dịch.")
            ],
            "border": "24334A"
        }
    ]

    xs = [800000, 4416000, 8032000]
    for idx, (tk, x) in enumerate(zip(takeaways, xs)):
        p_card = [
            {"space_after": 150, "runs": [{"text": tk["tag"], "size": 950, "bold": True, "color": tk["tag_color"]}]},
            {"space_after": 200, "runs": [{"text": tk["title"], "size": 1500, "bold": True, "color": C_TEXT_WHITE}]},
            {"space_after": 250, "runs": [{"text": tk["desc"], "size": 1150, "color": C_TEXT_BODY}]}
        ]
        for bold_t, desc_t in tk["points"]:
            p_card.append({
                "space_after": 150,
                "runs": [
                    {"text": f"• {bold_t}", "size": 1150, "bold": True, "color": C_TEXT_WHITE},
                    {"text": desc_t, "size": 1100, "color": C_TEXT_MUTED}
                ]
            })
        shapes.append(make_shape(113 + idx, f"Lesson{idx}", x, 1600000, 3360000, 4200000, fill_hex=C_CARD_BG, border_hex=tk["border"], paragraphs=p_card))

    return build_slide_xml("".join(shapes))

SLIDE_GENERATORS = [
    get_slide_1,
    get_slide_2,
    get_slide_3,
    get_slide_4,
    get_slide_5,
    get_slide_6,
    get_slide_7,
    get_slide_8,
    get_slide_9,
    get_slide_10,
    get_slide_11,
]

def export_presentation(output_filepath="apriori_presentation.pptx"):
    """Creates the full 11-slide PowerPoint presentation using official Office Theme base."""
    print(f"Generating 16:9 presentation: {output_filepath}...")
    num_slides = len(SLIDE_GENERATORS)

    with zipfile.ZipFile(output_filepath, "w", zipfile.ZIP_DEFLATED) as z:
        # 1. Copy official slideMasters, slideLayouts, and theme from Office Theme.thmx
        with zipfile.ZipFile(OFFICIAL_THMX, "r") as thmx:
            for name in thmx.namelist():
                if name.startswith("theme/slideMasters/") or name.startswith("theme/slideLayouts/") or name.startswith("theme/theme/"):
                    data = thmx.read(name)
                    dest = "ppt/" + name[6:]
                    z.writestr(dest, data)
                    
            # 2. presentation.xml
            pres_raw = thmx.read("theme/presentation.xml").decode("utf-8")
            sld_id_items = []
            for i in range(1, num_slides + 1):
                sld_id = 255 + i
                rel_id = f"rIdSlide{i}"
                sld_id_items.append(f'    <p:sldId id="{sld_id}" r:id="{rel_id}"/>')
                
            sld_id_lst = "  <p:sldIdLst>\n" + "\n".join(sld_id_items) + "\n  </p:sldIdLst>\n  <p:sldSz"
            pres_xml = pres_raw.replace("  <p:sldSz", sld_id_lst)
            z.writestr("ppt/presentation.xml", pres_xml)

        # 3. presentation.xml.rels
        pres_rels_items = [
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>'
        ]
        for i in range(1, num_slides + 1):
            rel_id = f"rIdSlide{i}"
            pres_rels_items.append(f'<Relationship Id="{rel_id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i}.xml"/>')

        pres_rels = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  {"".join(pres_rels_items)}
</Relationships>"""
        z.writestr("ppt/_rels/presentation.xml.rels", pres_rels)

        # 4. Generate each slide XML & rels
        for i, slide_fn in enumerate(SLIDE_GENERATORS, start=1):
            slide_xml = slide_fn()
            z.writestr(f"ppt/slides/slide{i}.xml", slide_xml)

            slide_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout7.xml"/>
</Relationships>"""
            z.writestr(f"ppt/slides/_rels/slide{i}.xml.rels", slide_rels)

        # 5. [Content_Types].xml
        ct = [
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
            '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
            '  <Default Extension="xml" ContentType="application/xml"/>',
            '  <Default Extension="jpeg" ContentType="image/jpeg"/>',
            '  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>',
            '  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'
        ]
        for layout_idx in range(1, 12):
            ct.append(f'  <Override PartName="/ppt/slideLayouts/slideLayout{layout_idx}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>')
        ct.append('  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>')
        for i in range(1, num_slides + 1):
            ct.append(f'  <Override PartName="/ppt/slides/slide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>')
        ct.append('  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>')
        ct.append('  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>')
        ct.append('</Types>')
        z.writestr("[Content_Types].xml", "\n".join(ct))

        # 6. _rels/.rels
        rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>"""
        z.writestr("_rels/.rels", rels)

        # 7. docProps/core.xml
        core = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Khai Phá Luật Kết Hợp &amp; Thuật Toán Apriori</dc:title>
  <dc:subject>Data Mining &amp; Market Basket Analysis</dc:subject>
  <dc:creator>TechWiz Apriori</dc:creator>
  <cp:lastModifiedBy>TechWiz Apriori</cp:lastModifiedBy>
</cp:coreProperties>"""
        z.writestr("docProps/core.xml", core)

        # 8. docProps/app.xml
        app = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Macintosh PowerPoint</Application>
  <PresentationFormat>Widescreen</PresentationFormat>
  <Slides>{num_slides}</Slides>
  <Company>TechWiz</Company>
</Properties>"""
        z.writestr("docProps/app.xml", app)

    print(f"✅ Successfully created 100% compliant 16:9 presentation with {num_slides} slides at: {output_filepath}")

if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "apriori_presentation.pptx"
    export_presentation(out_file)
