# Pesquisa de TCC - Segurança em LLMs

Este repositório armazena os códigos e dados da pesquisa de Trabalho de Conclusão de Curso (TCC) de **Eduardo Florêncio Pires de Almeida**. O projeto investiga a qualidade e a segurança do código de software gerado por Inteligência Artificial (LLMs).

## 🎓 Identificação Acadêmica

- **Autor:** Eduardo Florêncio Pires de Almeida
- **Instituição:** MBA USP/Esalq
- **Curso:** MBA em Engenharia de Software

## 🔍 O que é este projeto?

O objetivo é analisar como diferentes formas de pedir código a uma IA ("prompts") influenciam a segurança da aplicação final. Para isso, realizamos experimentos pedindo que modelos de IA criem uma API, variando o nível de detalhe e exigência de segurança em cada pedido.

## 🧪 Como funciona o experimento?

A pesquisa compara o código gerado em quatro cenários principais:

1.  **Cenário Ingênuo (C1):** Pedido básico, focado apenas em "fazer funcionar", sem mencionar segurança.
2.  **Cenário Funcional (C2):** Pedido com mais detalhes sobre as funcionalidades, mas ainda sem foco em proteção.
3.  **Cenário Seguro (C3):** Pedido que exige explicitamente medidas de segurança (como criptografia de senhas e prevenção de falhas conhecidas).
4.  **Cenário com Autochecagem (C4):** Experimentos onde a própria IA revisa e corrige seu código.

Os resultados nos ajudam a entender se "saber pedir" (Prompt Engineering) é suficiente para garantir um código seguro ou se as IAs tendem a gerar aplicações vulneráveis por padrão.

## 📂 Organização

- **`prompts/`**: Os textos exatos usados para instruir a IA em cada cenário.
- **`models/`**: O código fonte gerado pelas IAs (organizado por modelo e cenário), pronto para análise de vulnerabilidades.

---

_Este repositório foi construído para fins acadêmicos._
