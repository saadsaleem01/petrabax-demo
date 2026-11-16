import { workflow, node, trigger, sticky, ifElse, languageModel, outputParser, expr } from '@n8n/workflow-sdk';

const intake = trigger({
  type: 'n8n-nodes-base.formTrigger',
  version: 2.6,
  config: {
    name: 'Supplier Promo Intake',
    parameters: {
      formTitle: 'Petrabax · Supplier Promo Intake',
      formDescription: 'Upload a supplier PDF, paste a supplier email, or load a demo promo. The AI extracts every price tier, departure, deadline, discount, commission and restriction, then code checks each fact against the original before anything else happens.',
      formFields: {
        values: [
          { fieldLabel: 'Load a demo promo (optional)', fieldType: 'dropdown', fieldName: 'demo_sample', defaultValue: 'None - use my upload / text', fieldOptions: { values: [
            { option: 'None - use my upload / text' },
            { option: 'Spain & Portugal Grand Tour - Early Booking (complex)' },
            { option: 'Spain & Portugal Grand Tour - Supplier correction' },
            { option: 'Spain - Andalusia Winter Escape (clean)' },
            { option: 'Portugal - Coastal Highlights (conflicting + expired)' },
            { option: 'Morocco - Imperial Cities & Sahara (needs review)' }
          ] } },
          { fieldLabel: 'Supplier name', fieldName: 'supplier', placeholder: 'e.g. Iberia Dreams DMC' },
          { fieldLabel: 'Paste supplier email / promo text', fieldType: 'textarea', fieldName: 'promo_text', placeholder: 'Paste the promo email or flyer text here' },
          { fieldLabel: 'Or upload supplier PDF', fieldType: 'file', fieldName: 'promo_pdf', multipleFiles: false, acceptFileTypes: '.pdf' }
        ]
      },
      options: { appendAttribution: false, buttonLabel: 'Process promo' }
    }
  },
  output: [{ demo_sample: 'Spain & Portugal Grand Tour - Early Booking (complex)', supplier: '', promo_text: '' }]
});

const pdfUploaded = ifElse({
  version: 2.2,
  config: {
    name: 'PDF Uploaded?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 1 },
        conditions: [{ leftValue: expr('{{ Object.keys($binary || {}).length > 0 }}'), operator: { type: 'boolean', operation: 'true', singleValue: true }, rightValue: '' }],
        combinator: 'and'
      },
      options: {}
    }
  },
  output: [{}]
});

const extractPdf = node({
  type: 'n8n-nodes-base.extractFromFile',
  version: 1.2,
  config: {
    name: 'Extract PDF Text',
    parameters: { operation: 'pdf', binaryPropertyName: expr('{{ Object.keys($binary)[0] }}'), options: { joinPages: true } }
  },
  output: [{ text: 'promo text' }]
});

const buildSource = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Build Source Text', parameters: { jsCode: __CODE_BUILD_SOURCE__ } },
  output: [{ supplier: 'Iberia Dreams DMC', source_type: 'Demo sample', source_text: 'text' }]
});

const extractionModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  version: 1.3,
  config: {
    name: 'Extraction Model',
    parameters: { model: { __rl: true, mode: 'list', value: 'gpt-5-mini' }, builtInTools: {}, options: { reasoningEffort: 'low' } }
  }
});

const offerSchema = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured',
  version: 1.3,
  config: { name: 'Offer Schema', parameters: { jsonSchemaExample: __SCHEMA_EXAMPLE__ } }
});

const aiExtract = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.9,
  config: {
    name: 'AI Extract Offer',
    parameters: {
      promptType: 'define',
      text: expr('Today is {{ $now.toFormat("yyyy-MM-dd") }}.\nSupplier (as entered): {{ $json.supplier }}\n\nSUPPLIER PROMO MATERIAL:\n"""\n{{ $json.source_text }}\n"""'),
      hasOutputParser: true,
      messages: { messageValues: [{ message: __SYSTEM_PROMPT__ }] },
      batching: {}
    },
    subnodes: { model: extractionModel, outputParser: offerSchema }
  },
  output: [{ output: { tour_name: 'Spain & Portugal Grand Tour', price_tiers: [] } }]
});

const validate = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Validate Offer Against Source', parameters: { jsCode: __CODE_VALIDATE__ } },
  output: [{ promo_key: 'iberia-dreams-dmc__spain-portugal-grand-tour', status: 'green', red: [], yellow: [] }]
});

const findPrevious = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Find Previous Version',
    alwaysOutputData: true,
    parameters: {
      resource: 'row',
      operation: 'get',
      dataTableId: { __rl: true, mode: 'id', value: 'zN2bw1mbiNO3ReGl', cachedResultName: 'Petrabax Promotions' },
      matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'promo_key', condition: 'eq', keyValue: expr('{{ $json.promo_key }}') }] },
      returnAll: false,
      limit: 1
    }
  },
  output: [{ id: 1, promo_key: 'x', version: 1, offer_json: '{}' }]
});

const compare = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Compare With Previous Version', parameters: { jsCode: __CODE_COMPARE__ } },
  output: [{ promo_key: 'x', status: 'green', version: 1, page_html: '<div></div>' }]
});

const savePromo = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Save Promotion',
    parameters: {
      resource: 'row',
      operation: 'upsert',
      dataTableId: { __rl: true, mode: 'id', value: 'zN2bw1mbiNO3ReGl', cachedResultName: 'Petrabax Promotions' },
      matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'promo_key', condition: 'eq', keyValue: expr('{{ $json.promo_key }}') }] },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          promo_key: expr('{{ $json.promo_key }}'),
          supplier: expr('{{ $json.supplier }}'),
          tour_name: expr('{{ $json.tour_name }}'),
          status: expr('{{ $json.status }}'),
          version: expr('{{ $json.version }}'),
          price_from: expr('{{ $json.price_from }}'),
          currency: expr('{{ $json.currency }}'),
          booking_deadline: expr('{{ $json.booking_deadline }}'),
          issues: expr('{{ $json.issues }}'),
          changes: expr('{{ $json.changes }}'),
          offer_json: expr('{{ $json.offer_json }}'),
          customer_facts_json: expr('{{ $json.customer_facts_json }}'),
          source_text: expr('{{ $json.source_text }}'),
          updated_at: expr('{{ $json.updated_at }}')
        },
        matchingColumns: [],
        schema: [
          { id: 'promo_key', displayName: 'promo_key', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'supplier', displayName: 'supplier', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'tour_name', displayName: 'tour_name', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'version', displayName: 'version', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true },
          { id: 'price_from', displayName: 'price_from', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true },
          { id: 'currency', displayName: 'currency', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'booking_deadline', displayName: 'booking_deadline', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'issues', displayName: 'issues', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'changes', displayName: 'changes', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'offer_json', displayName: 'offer_json', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'customer_facts_json', displayName: 'customer_facts_json', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'source_text', displayName: 'source_text', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'updated_at', displayName: 'updated_at', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }
        ]
      }
    }
  },
  output: [{ id: 1 }]
});

const showResult = node({
  type: 'n8n-nodes-base.form',
  version: 2.5,
  config: {
    name: 'Show Result',
    parameters: {
      operation: 'completion',
      respondWith: 'showText',
      responseText: expr('{{ $("Compare With Previous Version").first().json.page_html }}')
    }
  },
  output: [{}]
});

const overview = sticky('## Petrabax · 1. Intake, Extract & Validate\n1. **Intake**: supplier PDF, pasted email, or a demo promo\n2. **Extract**: AI turns it into a structured offer: every price tier, departure, deadline, discount, commission and restriction, each with a verbatim source quote\n3. **Validate**: code (not AI) checks every value against the source, flags conflicts, expired deadlines and uncaptured prices\n4. **Corrections**: compares with the last saved version of the same promo and lists exactly what changed\n5. **Save**: stored in the *Petrabax Promotions* table for content generation', [], { color: 4, width: 520, height: 420 });

export default workflow('petrabax-intake-v2', 'Petrabax · 1. Intake, Extract & Validate')
  .add(intake)
  .to(pdfUploaded
    .onTrue(extractPdf.to(buildSource))
    .onFalse(buildSource))
  .add(buildSource)
  .to(aiExtract)
  .to(validate)
  .to(findPrevious)
  .to(compare)
  .to(savePromo)
  .to(showResult)
  .add(overview)
  .group('Extract & verify', [aiExtract, extractionModel, offerSchema, validate], { description: 'AI extracts the full offer with source quotes; code verifies every value and blocks bad promos' })
  .group('Correction check & save', [findPrevious, compare, savePromo], { description: 'Compares with the last saved version, lists supplier changes, saves to Petrabax Promotions' });
