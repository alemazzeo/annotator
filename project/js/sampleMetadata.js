sampleMetadataFields = [
  {
    "field": "sample.type",
    "type": "enum",
    "required": true,
    "options": {
      "openOnFocus": true,
      "items": ["Testigo", "Lateral", "Izquierdo", "Derecho", "Rotado", "Corona"]
    },
    "html": {
      "group": "Muestra",
      "caption": "Tipo",
      "html": "style=\"width: 500px;\""
    }
  },
  {
    "field": "sample.code",
    "type": "text",
    "required": true,
    "html": {
      "group": "Muestra",
      "caption": "Número",
      "html": "style=\"width: 500px;\""
    }
  },
  {
    "field": "sample.depth",
    "type": "float",
    "required": true,
    "options": {
      "arrows": true,
      "format": true,
      "precision": 2,
      "min": 0,
      "max": 2000,
      "step": 0.1
    },
    "html": {
      "group": "Muestra",
      "caption": "Profundidad",
      "html": "style=\"width: 500px;\""
    }
  },
  {
    "field": "sample.depthFixed",
    "type": "float",
    "required": false,
    "options": {
      "arrows": true,
      "format": true,
      "precision": 2,
      "min": 0,
      "max": 2000,
      "step": 0.01
    },
    "html": {
      "group": "Muestra",
      "caption": "Profundidad (corregida)",
      "html": "style=\"width: 500px;\""
    }
  },
  {
    "field": "others",
    "type": "text",
    "required": true,
    "html": {
      "caption": "Observaciones",
      "html": "style=\"width: 500px;\""
    }
  },
  {
    "field": "well.acronym",
    "type": "text",
    "required": true,
    "html": {
      "group": "Pozo",
      "caption": "Sigla de pozo",
      "html": "style=\"width: 500px;\""
    }
  },
  {
    "field": "well.idName",
    "type": "text",
    "required": false,
    "html": {
      "group": "Pozo",
      "caption": "Nombre del pozo",
      "html": "style=\"width: 500px;\""
    }
  },
  {
    "field": "well.operatingCompany",
    "type": "list",
    "required": false,
    "options": {
      "items": [
        "YPF S.A.", "Otra"
      ]
    },
    "html": {
      "group": "Pozo",
      "caption": "Empresa operadora",
      "html": "style=\"width: 500px;\""
    }
  },
  {
    "field": "well.field",
    "type": "text",
    "required": false,
    "html": {
      "group": "Pozo",
      "caption": "Yacimiento",
      "html": "style=\"width: 500px;\""
    }
  },
  {
    "field": "well.block",
    "type": "text",
    "required": false,
    "html": {
      "group": "Pozo",
      "caption": "Bloque",
      "html": "style=\"width: 500px;\""
    }
  },
  {
    "field": "well.basin",
    "type": "text",
    "required": false ,
    "html": {
      "group": "Pozo",
      "caption": "Cuenca",
      "html": "style=\"width: 500px;\""
    }
  },
  {
    "field": "well.province",
    "type": "text",
    "required": false,
    "html": {
      "group": "Pozo",
      "caption": "",
      "html": "style=\"width: 500px;\""
    }
  },
  {
    "field": "well.country",
    "type": "text",
    "required": false,
    "html": {
      "group": "Pozo",
      "caption": "",
      "html": "style=\"width: 500px;\""
    }
  },
  {
    "field": "well.x",
    "type": "float",
    "required": false,
    "html": {
      "group": "Pozo",
      "caption": "Coordenada x",
      "html": "style=\"width: 500px;\""
    }
  },
  {
    "field": "well.y",
    "type": "float",
    "required": false,
    "html": {
      "group": "Pozo",
      "caption": "Coordenada y",
      "html": "style=\"width: 500px;\""
    }
  },
  {
    "field": "well.z",
    "type": "float",
    "required": false,
    "html": {
      "group": "Pozo",
      "caption": "Coordenada z",
      "html": "style=\"width: 500px;\""
    }
  },
  {
    "field": "well.formation",
    "type": "text",
    "required": true,
    "html": {
      "group": "Pozo",
      "caption": "Formación",
      "html": "style=\"width: 500px;\""
    }
  },
  {
    "field": "well.type",
    "type": "list",
    "required": true,
    "options": {
      "items": ["Convencional", "Otros"]
    },
    "html": {
      "group": "Pozo",
      "caption": "Tipo de pozo",
      "html": "style=\"width: 500px;\""
    }
  },
]