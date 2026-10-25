"""Etiqueta una COPIA de la guía. No reconstruye el documento ni cambia el original.
Ejecutar con el Python del runtime de documentos (lxml).
"""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from copy import deepcopy
from hashlib import sha256
import json
import base64
from lxml import etree as E
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'documentos/procesos/inscripcion.docx'
TARGET=ROOT/'documentos/plantillas/inscripcion.docx'
W='http://schemas.openxmlformats.org/wordprocessingml/2006/main'
NS={'w':W}
def q(n): return '{'+W+'}'+n
def txt(e): return ''.join(e.xpath('.//w:t/text()',namespaces=NS))
def replace(e,old,new):
    nodes=e.xpath('.//w:t',namespaces=NS)
    full=''.join(n.text or '' for n in nodes)
    start=full.index(old); end=start+len(old); offset=0; inserted=False
    for n in nodes:
        value=n.text or ''; a=offset; b=a+len(value); offset=b
        if b<=start or a>=end: continue
        left=value[:max(0,start-a)]; right=value[max(0,end-a):]
        n.text=left+(new if not inserted else '')+right
        n.set('{http://www.w3.org/XML/1998/namespace}space','preserve'); inserted=True

def paragraph(text):
    p=E.Element(q('p')); r=E.SubElement(p,q('r')); E.SubElement(r,q('t')).text=text
    return p

def fill(cell,text):
    p=cell.find('w:p',NS)
    ts=p.xpath('.//w:t',namespaces=NS)
    if ts: ts[-1].text=(ts[-1].text or '')+text
    else:
        r=E.SubElement(p,q('r'))
        style=p.find('w:pPr/w:rPr',NS)
        if style is not None:r.append(deepcopy(style))
        E.SubElement(r,q('t')).text=text

def start_page(p):
    pr=p.find('w:pPr',NS)
    if pr is None:pr=E.Element(q('pPr'));p.insert(0,pr)
    if pr.find('w:pageBreakBefore',NS) is None:E.SubElement(pr,q('pageBreakBefore'))

def instruction_page(title,description,replacement,new_page=False):
    # Guidance pages deliberately have no official seal or signature block.
    result=[]
    for i,(text,size,bold) in enumerate([
        ('HOJA DE INDICACIONES',22,True),
        (title,40,True),
        (description,26,False),
        (replacement,26,True),
        ('Retira esta hoja de indicaciones antes de entregar el expediente.',24,False)
    ]):
        p=paragraph(text);pr=E.Element(q('pPr'));p.insert(0,pr)
        E.SubElement(pr,q('jc'),{q('val'):'center'})
        E.SubElement(pr,q('spacing'),{q('before'):'1440' if i==0 else '240',q('after'):'240',q('line'):'320',q('lineRule'):'auto'})
        E.SubElement(pr,q('keepNext')) if i<4 else None
        r=p.find('w:r',NS);rp=E.Element(q('rPr'));r.insert(0,rp)
        E.SubElement(rp,q('rFonts'),{q('ascii'):'Cambria',q('hAnsi'):'Cambria'})
        E.SubElement(rp,q('sz'),{q('val'):str(size)})
        E.SubElement(rp,q('color'),{q('val'):'000000'})
        if bold:E.SubElement(rp,q('b'))
        if i==0 and new_page:start_page(p)
        result.append(p)
    return result

with ZipFile(SOURCE) as z:
    root=E.fromstring(z.read('word/document.xml')); body=root.find('w:body',NS); b=list(body)
    assert txt(b[49]).startswith('Formulario No. 1:') and txt(b[106]).startswith('Carta No. 2 ')
    def cell(table,row,col):return b[table].findall('w:tr',NS)[row].findall('w:tc',NS)[col]
    replace(b[32],txt(b[32]),'{fechaEmision}')
    replace(b[35],'_________________________________________________','{destinatario}')
    replace(b[38],'estudiantes (sólo nº de estudiantes, sin nombres) aptos','{solicitud_estudiantes}')
    replace(b[38],'___________________________________________','{carreras} ')
    replace(b[38],'(NOMBRE DEL PROYECTO, CON EL NUMERO DE BENEFICIARIOS, LUGAR DONDE SE EJECUTARÁ)','{titulo}, {beneficiarios} beneficiarios, {lugarEjecucion}')
    replace(b[40],'(FECHA DE INICIO)','{inicio}');replace(b[40],'(FECHA DE FINALIZACION)','{fin}')
    replace(b[42],txt(b[42]),'Detallar: {aportes}')
    # Fixed tab columns keep names and phone values over their original labels.
    for i,labels in [(45,['{responsable}','______________________','{telefonoInstitucion}']),(46,['NOMBRE','FIRMA','TELEFONO'])]:
        p=b[i]; pr=p.find('w:pPr',NS); style=deepcopy(p.find('w:r/w:rPr',NS))
        for child in list(p):
            if child is not pr:p.remove(child)
        for child in list(pr):
            if child.tag in [q('tabs'),q('ind'),q('jc')]:pr.remove(child)
        tabs=E.SubElement(pr,q('tabs'))
        for pos in [1800,5400,7950]:E.SubElement(tabs,q('tab'),{q('val'):'center',q('pos'):str(pos)})
        for label in labels:
            r=E.SubElement(p,q('r'));r.append(deepcopy(style));E.SubElement(r,q('tab'));E.SubElement(r,q('t')).text=label
    # Remove the sample's forced line wrap so a short career name is not stretched.
    for br in b[38].xpath('.//w:br',namespaces=NS):br.getparent().remove(br)
    # Keep the signature line in the middle; no signatures or seals are generated.
    for i in [53,80,112]: replace(b[i],txt(b[i]),'DEPARTAMENTO DE {departamento}')
    for row,col,key in [(0,1,'nombre'),(0,3,'carnet'),(1,1,'carrera'),(1,3,'codigo'),(3,0,'direccion'),(3,2,'fijo'),(4,2,'movil'),(6,1,'porcentaje')]:
        fill(cell(57,row,col),'{'+key+'}'+(' %' if key=='porcentaje' else ''))
    fill(cell(57,5,1),' {email}')
    # Preserve the original availability columns and repeat rows as needed.
    for col,tag in enumerate(['{#horarios}{horario}','{dias}','{otros}{/horarios}']):fill(cell(59,0,col),tag)
    for row in b[59].findall('w:tr',NS)[1:]:b[59].remove(row)
    fill(cell(61,0,0),'{institucionDireccion}')
    fill(cell(61,1,1),'{telefonoInstitucion}');fill(cell(61,2,1),'{responsable}')
    fill(cell(63,0,0),'{titulo}');fill(cell(63,1,1),'{inicio}')
    fill(cell(65,0,0),'{observaciones}');fill(cell(68,0,0),'{tutor}')
    replace(b[74],txt(b[74]),'{fechaEmision}')
    replace(b[83],txt(b[83]),'{fechaEmision}')
    replace(b[85],txt(b[85]),'{tutor}')
    for i in [86,102]:replace(b[i],txt(b[i]),'{departamento} / {seccion}')
    for col,tag in enumerate(['{#alumnos}{nombre}','{carnet}','{carrera}{/alumnos}']):fill(cell(92,1,col),tag)
    # The sample has two blank rows; a loop replaces both with exactly N rows.
    b[92].remove(b[92].findall('w:tr',NS)[2])
    replace(b[94],txt(b[94]),'Quien/es realizará/an su Servicio Social en {institucion} en el proyecto denominado:')
    replace(b[95],txt(b[95]),'{titulo}')
    replace(b[100],txt(b[100]),'{coordinador}')
    replace(b[116],'______________________________________________________________________________',' {nombre}')
    replace(b[117],'_________________________','{carnet}')
    replace(b[117],'________________________________________________________',' {carrera}')
    for col,key in enumerate(['titulo','lugarEjecucion','periodo','costos','financiamiento','horas']):fill(cell(121,1,col),'{'+key+'}')
    replace(b[125],txt(b[125]),'{fechaEmision}')
    # Explicit page starts prevent the original natural pagination from drifting
    # when optional blank text is replaced. Repeat the original individual pages.
    for i in [49,76,106]:start_page(b[i])
    # The first form also works as page 1 when the institutional letter is omitted.
    b[49].find('w:pPr/w:spacing',NS).set(q('before'),'0')
    # Reclaim redundant blank lines in the tutor letter for the growing group table.
    for i in [84,88,91,93,97]:
        pr=b[i].find('w:pPr',NS)
        spacing=pr.find('w:spacing',NS)
        if spacing is None:spacing=E.SubElement(pr,q('spacing'))
        for key,value in [('before','0'),('after','0'),('line','100'),('lineRule','exact')]:spacing.set(q(key),value)
    for i in [98,99,100,101]:
        pr=b[i].find('w:pPr',NS)
        if pr.find('w:keepNext',NS) is None:E.SubElement(pr,q('keepNext'))
    for e in list(body):body.remove(e)
    body.append(paragraph('{^incluirCartaInstitucion}'))
    for e in instruction_page(
        'Adjunta la carta de solicitud de la institución',
        'La carta de solicitud no se generó con el sistema. Coloca al inicio del expediente la carta que emita la institución solicitante.',
        'Sustituye esta hoja por la carta revisada y firmada por la institución.'
    ):body.append(e)
    body.append(paragraph('{/incluirCartaInstitucion}'))
    body.append(paragraph('{#incluirCartaInstitucion}'))
    for e in b[29:49]:body.append(e)
    body.append(paragraph('{/incluirCartaInstitucion}'))
    body.append(paragraph('{#alumnos}'))
    for e in b[49:75]:body.append(e)
    body.append(paragraph('{/alumnos}'))
    for e in b[76:103]:body.append(e)
    body.append(paragraph('{#alumnos}'))
    for e in b[106:131]:body.append(e)
    body.append(paragraph('{/alumnos}'))
    for e in instruction_page(
        'Adjunta la constancia del 60 % de materias aprobadas',
        'Solicita a Administración Académica la constancia que acredita el 60 % de materias aprobadas. Adjunta una constancia por cada alumno participante.',
        'Sustituye esta hoja por las constancias académicas al final del expediente.',
        new_page=True
    ):body.append(e)
    body.append(b[-1])
    # A sample TOC bookmark is not referenced in the extracted packet and cannot
    # have the same id/name on every repeated individual letter.
    for e in root.xpath('//w:bookmarkStart|//w:bookmarkEnd|//w:lastRenderedPageBreak',namespaces=NS):e.getparent().remove(e)
    TARGET.parent.mkdir(parents=True,exist_ok=True)
    with ZipFile(TARGET,'w',ZIP_DEFLATED) as out:
        for item in z.infolist():out.writestr(deepcopy(item),E.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True) if item.filename=='word/document.xml' else z.read(item.filename))
    parts={n:sha256(z.read(n)).hexdigest() for n in z.namelist() if n!='word/document.xml'}
manifest={'source':'documentos/procesos/inscripcion.docx','source_sha256':sha256(SOURCE.read_bytes()).hexdigest(),'template':'documentos/plantillas/inscripcion.docx','preserved_parts':parts,'changed_parts':['word/document.xml']}
(ROOT/'documentos/plantillas/inscripcion-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
# Keep the existing offline fallback synchronized with the served template.
encoded=base64.b64encode(TARGET.read_bytes()).decode('ascii')
wrapper="""(function(root){const api={base64:BASE64};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SIGPSInscripcionPlantilla=api;})(typeof window==='undefined'?globalThis:window);"""
(ROOT/'js/inscripcion-plantilla.js').write_text(wrapper.replace('BASE64',json.dumps(encoded))+'\n')
print(TARGET)
