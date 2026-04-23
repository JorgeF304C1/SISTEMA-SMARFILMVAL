import os
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "templates")
env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

def generate_pdf(template_name: str, context: dict, output_path: str):
    template = env.get_template(template_name)
    html_out = template.render(**context)
    # Generate PDF
    HTML(string=html_out, base_url=TEMPLATE_DIR).write_pdf(output_path)
    return output_path
