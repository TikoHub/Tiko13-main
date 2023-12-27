from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom import minidom
from lxml import etree

def create_fb2(chapter):
    book = Element('FictionBook', attrib={'xmlns': "http://www.gribuser.ru/xml/fictionbook/2.0"})

    # Add the title
    title_info = SubElement(book, 'title-info')
    book_title = SubElement(title_info, 'book-title')
    book_title.text = chapter.book.name

    # Add the chapter content
    body = SubElement(book, 'body')
    section = SubElement(body, 'section')
    title = SubElement(section, 'title')
    title.text = chapter.title
    p = SubElement(section, 'p')
    p.text = chapter.content

    # Convert to string
    xml_str = tostring(book, encoding='utf-8')
    pretty_xml = minidom.parseString(xml_str).toprettyxml(indent="   ")
    return pretty_xml


def parse_fb2(fb2_file):
    try:
        tree = etree.parse(fb2_file)
        ns = {'fb': 'http://www.gribuser.ru/xml/fictionbook/2.0'}
        content = ""
        for element in tree.iterfind('.//fb:body', namespaces=ns):
            content += etree.tostring(element, pretty_print=True, encoding='unicode')
        return content
    except etree.XMLSyntaxError as e:
        raise ValueError(f"Error parsing FB2 file: {e}")



