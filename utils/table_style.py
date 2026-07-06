from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


def set_cell_border(cell):

    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()

    borders = OxmlElement('w:tcBorders')

    for border_name in (
        'top',
        'left',
        'bottom',
        'right'
    ):

        border = OxmlElement(f'w:{border_name}')

        border.set(qn('w:val'), 'single')
        border.set(qn('w:sz'), '8')
        border.set(qn('w:space'), '0')
        border.set(qn('w:color'), '000000')

        borders.append(border)

    tcPr.append(borders)


def style_cell(cell, center=False):

    for paragraph in cell.paragraphs:

        paragraph.alignment = (
            WD_ALIGN_PARAGRAPH.CENTER
            if center
            else WD_ALIGN_PARAGRAPH.LEFT
        )

        for run in paragraph.runs:

            run.font.name = "Arial"
            run.font.size = Pt(12)

    set_cell_border(cell)