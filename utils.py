import re

def limpiar_diagnostico(diagnostico):
    # Convertir a minúsculas
    diagnostico = diagnostico.lower()
    
    # Eliminar tildes y caracteres especiales
    diagnostico = re.sub(r'[áéíóú]', lambda x: chr(ord(x.group(0)) - 0x20), diagnostico)
    diagnostico = re.sub(r'[àèìòù]', lambda x: chr(ord(x.group(0)) - 0x30), diagnostico)
    diagnostico = re.sub(r'[âêîôû]', lambda x: chr(ord(x.group(0)) - 0x10), diagnostico)
    diagnostico = re.sub(r'[ãõ]', lambda x: chr(ord(x.group(0)) - 0x2A), diagnostico)
    diagnostico = re.sub(r'[ç]', 'c', diagnostico)
    
    # Eliminar espacios en blanco extra al inicio y al final
    diagnostico = diagnostico.strip()
    
    return diagnostico
