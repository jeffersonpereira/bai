import sqlite3
import re

data = [
  {
    "title": "Apartamento Kitchenette/Studio em Bela Vista - São Paulo",
    "price": "R$ 950",
    "area": "28m²",
    "image_url": "https://img.olx.com.br/thumbs700x500/28/287650626937882.webp",
    "source_url": "https://sp.olx.com.br/sao-paulo-e-regiao/imoveis/apartamento-kitchenette-studio-em-bela-vista-sao-paulo-1485425680",
    "city": "São Paulo",
    "neighborhood": "Bela Vista",
    "source": "OLX"
  },
  {
    "title": "Excelente apartamento na Vila Andrade, Morumbi",
    "price": "R$ 2.000",
    "area": "50m²",
    "image_url": "https://img.olx.com.br/thumbs700x500/70/703655250888931.webp",
    "source_url": "https://sp.olx.com.br/sao-paulo-e-regiao/imoveis/excelente-apartamento-em-condominio-fechado-com-lazer-completo-na-vila-andrade-morumbi-1479143741",
    "city": "São Paulo",
    "neighborhood": "Vila Andrade",
    "source": "OLX"
  },
  {
    "title": "Casa térrea com 4 dormitórios à venda - Granja Viana - Cotia/SP",
    "price": "R$ 2.900.000",
    "area": "300m²",
    "image_url": "https://img.olx.com.br/thumbs700x500/18/185578513510852.webp",
    "source_url": "https://sp.olx.com.br/sao-paulo-e-regiao/imoveis/casa-terrea-com-4-dormitorios-sendo-3-suites-a-venda-granja-viana-cotia-sp-1388688479",
    "city": "Cotia",
    "neighborhood": "Granja Viana",
    "source": "OLX"
  },
  {
    "title": "Casa Quitinete para Aluguel em Pinheiros São Paulo-SP",
    "price": "R$ 800",
    "area": "10m²",
    "image_url": "https://img.olx.com.br/thumbs700x500/88/880598365227826.webp",
    "source_url": "https://sp.olx.com.br/sao-paulo-e-regiao/imoveis/casa-quitinete-para-aluguel-em-pinheiros-sao-paulo-sp-1371998404",
    "city": "São Paulo",
    "neighborhood": "Pinheiros",
    "source": "OLX"
  },
  {
    "title": "LOTES AMPLOS EM IGARATÁ/SP",
    "price": "R$ 79.990",
    "area": "1000m²",
    "image_url": "https://img.olx.com.br/thumbs700x500/59/592601500880748.webp",
    "source_url": "https://sp.olx.com.br/sao-paulo-e-regiao/terrenos/lotes-amplos-em-igarata-sp-1485482191",
    "city": "Igaratá",
    "neighborhood": "Centro",
    "source": "OLX"
  },
  {
    "title": "Casa para aluguel em Vila Boaventura - Jundiaí",
    "price": "R$ 588",
    "area": "10m²",
    "image_url": "https://img.olx.com.br/thumbs700x500/82/822695265818376.webp",
    "source_url": "https://sp.olx.com.br/sao-paulo-e-regiao/imoveis/casa-para-aluguel-tem-10-metros-quadrados-em-vila-boaventura-jundiai-sao-paulo-1485333484",
    "city": "Jundiaí",
    "neighborhood": "Vila Boaventura",
    "source": "OLX"
  },
  {
    "title": "Para locação, Conjunto Promorar Raposo Tavares, São Paulo",
    "price": "R$ 1.000",
    "area": "35m²",
    "image_url": "https://img.olx.com.br/thumbs700x500/33/333626265360516.webp",
    "source_url": "https://sp.olx.com.br/sao-paulo-e-regiao/imoveis/para-locacao-conjunto-promorar-raposo-tavares-sao-paulo-sp-1485394600",
    "city": "São Paulo",
    "neighborhood": "Raposo Tavares",
    "source": "OLX"
  },
  {
    "title": "Mini chácara para trocar - Itapevi",
    "price": "R$ 170.000",
    "area": "600m²",
    "image_url": "https://img.olx.com.br/thumbs700x500/71/714612628751561.webp",
    "source_url": "https://sp.olx.com.br/sao-paulo-e-regiao/terrenos/mini-chacara-para-trocar-1485482044",
    "city": "Itapevi",
    "neighborhood": "Vila Santo Antônio",
    "source": "OLX"
  },
  {
    "title": "Apartamento Parque da Mooca - Venda",
    "price": "R$ 2.750.000",
    "area": "184m²",
    "image_url": "https://img.olx.com.br/thumbs700x500/59/592525815732970.webp",
    "source_url": "https://sp.olx.com.br/sao-paulo-e-regiao/imoveis/apartamento-parque-da-mooca-184-metros-3-suites-3-vagas-sacada-gourmet-lazer-completo-1436357697",
    "city": "São Paulo",
    "neighborhood": "Parque da Mooca",
    "source": "OLX"
  },
  {
    "title": "Casa Vila Ana Jundiaí - 5 quartos",
    "price": "R$ 695.000",
    "area": "250m²",
    "image_url": "https://img.olx.com.br/thumbs700x500/49/491642746234275.webp",
    "source_url": "https://sp.olx.com.br/sao-paulo-e-regiao/imoveis/casa-vila-ana-jundiai-5-quartos-1485484166",
    "city": "Jundiaí",
    "neighborhood": "Vila Ana",
    "source": "OLX"
  },
  {
    "title": "Apartamento para aluguel com 3 quartos, aceita pets.",
    "price": "R$ 3.800",
    "area": "78 m²",
    "image_url": "https://img.imovelweb.com.br/thumbs/2995139389_700x500.jpg",
    "source_url": "https://www.imovelweb.com.br/propriedades/apartamento-para-aluguel-vila-clementino-3-quartos-2995139389.html",
    "city": "São Paulo",
    "neighborhood": "Vila Mariana",
    "source": "Imovelweb"
  },
  {
    "title": "Aluguel de apartamento mobiliado em Presidente Altino",
    "price": "R$ 2.600",
    "area": "49 m²",
    "image_url": "https://img.imovelweb.com.br/thumbs/3027498359_700x500.jpg",
    "source_url": "https://www.imovelweb.com.br/propriedades/apartamento-para-aluguel-centro-2-quartos-49-m2-3027498359.html",
    "city": "Osasco",
    "neighborhood": "Presidente Altino",
    "source": "Imovelweb"
  },
  {
    "title": "Apartamento Itaim Bibi - Mobiliado",
    "price": "R$ 5.000",
    "area": "44 m²",
    "image_url": "https://img.imovelweb.com.br/thumbs/2992908686_700x500.jpg",
    "source_url": "https://www.imovelweb.com.br/propriedades/apartamento-para-aluguel-itaim-bibi-1-quarto-44-2992908686.html",
    "city": "São Paulo",
    "neighborhood": "Itaim Bibi",
    "source": "Imovelweb"
  },
  {
    "title": "Apartamento na Vila Mariana com 120m2, 3 quartos",
    "price": "R$ 5.000",
    "area": "120 m²",
    "image_url": "https://img.imovelweb.com.br/thumbs/3028865051_700x500.jpg",
    "source_url": "https://www.imovelweb.com.br/propriedades/imoveis-na-vila-mariana-3028865051.html",
    "city": "São Paulo",
    "neighborhood": "Vila Mariana",
    "source": "Imovelweb"
  },
  {
    "title": "Alugar apartamento mobiliado na Pompeia com varanda",
    "price": "R$ 2.500",
    "area": "35 m²",
    "image_url": "https://img.imovelweb.com.br/thumbs/3010874881_700x500.jpg",
    "source_url": "https://www.imovelweb.com.br/propriedades/apartamento-para-aluguel-vila-pompeia-1-quarto-35-3010874881.html",
    "city": "São Paulo",
    "neighborhood": "Pompéia",
    "source": "Imovelweb"
  },
  {
    "title": "Alugar apartamento no Jardim Taboão: 3 quartos",
    "price": "R$ 2.924",
    "area": "110 m²",
    "image_url": "https://img.imovelweb.com.br/thumbs/3020900922_700x500.jpg",
    "source_url": "https://www.imovelweb.com.br/propriedades/apartamento-para-aluguel-jardim-taboao-3-quartos-3020900922.html",
    "city": "São Paulo",
    "neighborhood": "Jardim Taboão",
    "source": "Imovelweb"
  },
  {
    "title": "Apartamento para aluguel Tatuapé - 1 quarto",
    "price": "R$ 3.300",
    "area": "53 m²",
    "image_url": "https://img.imovelweb.com.br/thumbs/3029243268_700x500.jpg",
    "source_url": "https://www.imovelweb.com.br/propriedades/apartamento-para-aluguel-tatuape-1-quarto-53-m2-3029243268.html",
    "city": "São Paulo",
    "neighborhood": "Tatuapé",
    "source": "Imovelweb"
  },
  {
    "title": "Apartamento aconchegante em Guarulhos - 2 quartos",
    "price": "R$ 2.600",
    "area": "56 m²",
    "image_url": "https://img.imovelweb.com.br/thumbs/3029554555_700x500.jpg",
    "source_url": "https://www.imovelweb.com.br/propriedades/apartamento-aconchegante-em-guarulhos-2-quartos-3029554555.html",
    "city": "Guarulhos",
    "neighborhood": "Vila Moreira",
    "source": "Imovelweb"
  },
  {
    "title": "Apartamento para aluguel Tatuapé com Piscina",
    "price": "R$ 5.000",
    "area": "41 m²",
    "image_url": "https://img.imovelweb.com.br/thumbs/3001541576_700x500.jpg",
    "source_url": "https://www.imovelweb.com.br/propriedades/apartamento-para-aluguel-tatuape-1-quarto-41-m2-3001541576.html",
    "city": "São Paulo",
    "neighborhood": "Tatuapé",
    "source": "Imovelweb"
  },
  {
    "title": "Apartamento Vila Mascote com 4 quartos",
    "price": "R$ 5.000",
    "area": "145 m²",
    "image_url": "https://img.imovelweb.com.br/thumbs/3025408649_700x500.jpg",
    "source_url": "https://www.imovelweb.com.br/propriedades/apartamento-para-aluguel-vila-mascote-4-quartos-3025408649.html",
    "city": "São Paulo",
    "neighborhood": "Vila Mascote",
    "source": "Imovelweb"
  }
]

def clean_value(val):
    if not val: return 0.0
    digits = re.sub(r'[^\d]', '', str(val))
    return float(digits) if digits else 0.0

conn = sqlite3.connect('bai.db')
cursor = conn.cursor()

for item in data:
    price = clean_value(item['price'])
    area = clean_value(item['area'])
    
    cursor.execute('''
        INSERT OR IGNORE INTO properties 
        (title, price, area, image_url, source_url, city, neighborhood, source, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        item['title'], 
        price, 
        area, 
        item['image_url'], 
        item['source_url'], 
        item['city'], 
        item['neighborhood'],
        item['source'],
        f"{item['title']}. Localizado em {item['neighborhood']}, {item['city']}."
    ))

conn.commit()
print(f"Inseridos {len(data)} registros com sucesso.")
conn.close()
