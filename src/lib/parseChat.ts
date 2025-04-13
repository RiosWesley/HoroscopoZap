// Define the structure for a parsed message
export interface ParsedMessage {
  timestamp: Date | null; // Use Date object for easier manipulation
  sender: string | null; // null for system messages
  message: string;
  isSystemMessage: boolean; // Flag for system messages
}

// Regex patterns to handle different WhatsApp timestamp formats

// Format 1: [DD/MM/YYYY, HH:MM:SS] Remainder
// MODIFICADO: Adicionado (?:\u200e)? após \] para lidar com caractere invisível antes do remetente
const regexFormat1 = /^(?:\u200e)?\[(\d{1,2}[./]\d{1,2}[./]\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(?:\u200e)?(.*)$/;

// Format 2: DD/MM/YYYY HH:MM da [manhã|tarde|noite] - Remainder
const regexFormat2 = /^(?:\u200e)?(\d{1,2}[./]\d{1,2}[./]\d{2,4})\s+(\d{1,2}:\d{2})\s+(?:da\s+)?(manhã|tarde|noite)\s*[-–]\s*(.*)$/i;

// Original Format (Fallback): DD/MM/YY, HH:MM - Remainder
const regexOriginal = /^(?:\u200e)?(\d{1,2}[./]\d{1,2}[./]\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\s*[-–]\s*(.*)$/i;

// New Format: DD/MM/YYYY SenderName (without time, no colon, no dash) - Remains the same
const regexDateNameOnly = /^(?:\u200e)?(\d{1,2}[./]\d{1,2}[./]\d{2,4})\s+([^\d:]+)$/;

// Keywords indicating system messages (add more as needed)
const systemMessageKeywords = [
  'adicionou', 'added',
  'removeu', 'removed',
  'saiu', 'left',
  'entrou usando o link', 'joined using this group\'s invite link',
  'mudou o nome do grupo', 'changed the subject',
  'mudou a descrição do grupo', 'changed the group description',
  'mudou a imagem do grupo', 'changed this group\'s icon',
  'apagou a imagem do grupo', 'deleted this group\'s icon',
  'criou o grupo', 'created group',
  'agora é admin', 'is now an admin',
  'não é mais admin', 'is no longer an admin',
  'As mensagens temporárias estão ativadas', 'Disappearing messages are on',
  'As mensagens temporárias estão desativadas', 'Disappearing messages are off',
  'Você mudou para mensagens temporárias', 'You turned on disappearing messages',
  'Você desativou as mensagens temporárias', 'You turned off disappearing messages',
  'As mensagens e ligações são protegidas com a criptografia de ponta a ponta', // <-- ADICIONADO PORTUGUÊS
  'Messages and calls are end-to-end encrypted', // Inglês
  // Add more variations if necessary
];

const mediaPlaceholders = [
 'áudio ocultado',
 'imagem oculta',
 'vídeo oculto',
 'audio omitted',
 'image omitted',
 'video omitted',
 // 'áudio oculto', // Redundante
 // 'imagem oculta', // Redundante
 // 'vídeo oculto', // Redundante
 // 'áudio ocultado', // Redundante
 'imagem ocultada',
 'vídeo ocultado',
 'figurinha omitida',
 '\u200efigurinha omitida',
 '\u200eimagem ocultada',
 '\u200eáudio ocultado',
 '\u200evídeo ocultado',
 'documento omitido',       // Adicione esta linha
 '\u200edocumento omitido',  // Adicione esta linha (com caractere invisível)
 'document omitted',        // Adicione esta linha (versão em inglês, por segurança)
 'audio hidden',
 'image hidden',
 'video hidden',
 'sticker omitted',
];

/**
 * Parses the raw text content of a WhatsApp chat export.
 *
 * @param rawText The raw string content from the .txt file.
 * @returns An array of ParsedMessage objects.
 */
export const parseChat = (rawText: string): ParsedMessage[] => {
  // MODIFICADO: Usa split(/\r?\n/) para lidar com line endings de Windows e Unix
  // MODIFICADO: Filtra mensagens de criptografia ANTES do loop principal
  const lines = rawText
      .trim()
      .split(/\r?\n/) // <-- Split robusto
      .filter(line => {
          const trimmedLine = line.trim();
          if (trimmedLine === '') return false; // Remove linhas vazias
          // Remove mensagens de criptografia conhecidas (após o timestamp ser removido mentalmente)
          if (systemMessageKeywords.some(keyword => trimmedLine.includes(keyword) && keyword.includes('criptografia'))) {
             console.log(`Filtering out encryption message line: ${line}`);
             return false;
          }
          // Filtro original (caso haja outras mensagens sem timestamp no início)
          // if (trimmedLine.includes('Messages and calls are end-to-end encrypted')) {
          //   return false
          // }
          return true;
      });

  const messages: ParsedMessage[] = [];
  let currentMessage: ParsedMessage | null = null;

  console.log(`Starting parsing of ${lines.length} filtered lines.`); // Debug log

  let pendingDate: string | null = null;
  let pendingSender: string | null = null;

  lines.forEach((line, index) => { // Adicionado index para debug
    // Adiciona um log para cada linha sendo processada
    // console.log(`Processing line ${index + 1}: ${line}`);

    try {
      let match: RegExpMatchArray | null = null;
      let formatType: 'format1' | 'format2' | 'original' | 'dateNameOnly' | null = null;
      let dateStr: string | undefined;
      let timeStr: string | undefined;
      let period: string | undefined;
      let sender: string | null = null;
      let messageContent: string;
      let remainder: string;

      // Tenta o formato mais comum primeiro ([Date, Time] Remainder)
      match = line.match(regexFormat1);
      if (match) {
        formatType = 'format1';
        [, dateStr, timeStr, remainder] = match;
         // console.log(`  Matched regexFormat1: Date=${dateStr}, Time=${timeStr}, Remainder=${remainder.substring(0,30)}...`);
      } else {
        match = line.match(regexOriginal); // Tenta o formato original (Date, Time - Remainder)
        if (match) {
          formatType = 'original';
          [, dateStr, timeStr, remainder] = match;
          // console.log(`  Matched regexOriginal: Date=${dateStr}, Time=${timeStr}, Remainder=${remainder.substring(0,30)}...`);
        } else {
          match = line.match(regexFormat2); // Tenta o formato com período (manhã/tarde/noite)
          if (match) {
            formatType = 'format2';
            [, dateStr, timeStr, period, remainder] = match;
            // console.log(`  Matched regexFormat2: Date=${dateStr}, Time=${timeStr}, Period=${period}, Remainder=${remainder.substring(0,30)}...`);
          } else {
            match = line.match(regexDateNameOnly); // Tenta o formato Date Sender (sem hora)
            if (match) {
              formatType = 'dateNameOnly';
              [, dateStr, sender] = match;
              pendingDate = dateStr;
              pendingSender = sender.trim();
              // console.log(`  Matched regexDateNameOnly: Date=${dateStr}, Sender=${pendingSender}`);
              return; // Pula para a próxima linha, esperando o conteúdo da mensagem
            }
            // else { // Se nenhuma regex bateu
            //   console.log(`  No regex matched for line: ${line}`);
            // }
          }
        }
      }

      // --- Start Processing Line ---
      if (formatType && formatType !== 'dateNameOnly' && dateStr && timeStr !== undefined && remainder !== undefined) {
        // Linha correspondeu a um formato com Data, Hora e Restante
        remainder = remainder.trim(); // Remove espaços extras no início/fim do restante
        const timestamp = parseWhatsAppDateTime(dateStr, timeStr, period);

        // --- Extração do Remetente e Mensagem ---
        // A regex ^([^:]+):\s*(.*)$/s é robusta para "Sender: Message" e ".: Message"
        const senderColonMatch = remainder.match(/^([^:]+):\s*(.*)$/s);
        if (senderColonMatch) {
          sender = senderColonMatch[1].trim(); // Pega o remetente e remove espaços
          messageContent = senderColonMatch[2].trim(); // Pega a mensagem e remove espaços

          // Tratamento específico para caractere invisível remanescente no início da mensagem
          if (messageContent.startsWith('\u200e')) {
              messageContent = messageContent.substring(1).trim();
          }

          // Verifica se o remetente é só o caractere invisível (caso raro)
          if (sender === '\u200e') {
             console.warn(`Detected invisible character as sender, treating as system message. Line: ${line}`);
             sender = null; // Anula o remetente
          }
        } else {
          // Se não encontrou ':' no formato "Sender: Message",
          // pode ser uma mensagem de sistema ou algo inesperado.
          // Assume que todo o 'remainder' é a mensagem e não há remetente explícito.
          sender = null; // Sem remetente identificado
          messageContent = remainder; // O restante é a mensagem
          // console.log(`  No 'Sender: Message' pattern found in remainder. Treating as system/unknown. Remainder: ${remainder}`);
        }
        // --- Fim da Extração ---

        const trimmedMessageContent = messageContent; // Já foi trimado
        const lowerMessageContent = trimmedMessageContent.toLowerCase();

        // --- System Message Check ---
        // Limpa a lista de placeholders para evitar duplicação e garantir trim
        const uniqueTrimmedPlaceholders = [...new Set(mediaPlaceholders.map(p => p.trim()))];

        const isMediaPlaceholder = uniqueTrimmedPlaceholders.some(ph =>
            lowerMessageContent === ph || // Match exato
            (ph.startsWith('\u200e') && lowerMessageContent === ph.substring(1)) // Match exato ignorando LRM inicial no placeholder
        );

        const isEditedMessage = lowerMessageContent.includes('<mensagem editada>') || lowerMessageContent.includes('<message edited>');

        // Verifica se a mensagem *contém* alguma keyword de sistema (ex: 'Fulano adicionou Ciclano')
        // OU se a mensagem *é exatamente* uma keyword (útil para 'saiu', 'left')
        const containsSystemKeyword = systemMessageKeywords.some(keyword =>
            lowerMessageContent.includes(keyword) || lowerMessageContent === keyword.toLowerCase()
        );

        // É sistema se for mídia, editada, contiver keyword de sistema, OU não tiver remetente
        const isSystem = isMediaPlaceholder || isEditedMessage || containsSystemKeyword || sender === null;
        // --- End System Message Check ---

        const finalSender = sender; // Mantém o remetente (pode ser null)

        // console.log(`  Creating message: Sender=${finalSender}, System=${isSystem}, Content=${trimmedMessageContent.substring(0, 50)}...`);
        currentMessage = {
          timestamp: timestamp,
          sender: finalSender,
          message: trimmedMessageContent,
          isSystemMessage: isSystem,
        };
        messages.push(currentMessage);
        pendingDate = null; // Reseta estado pendente
        pendingSender = null;

      } else if (formatType === 'dateNameOnly') {
        // Já tratado acima com 'return'
        return;

      } else if (pendingDate && pendingSender) {
        // Esta linha é a mensagem para a linha anterior 'dateNameOnly'
        // console.log(`Processing message for pending sender: ${pendingSender}`);
        const timestamp = parseWhatsAppDateTime(pendingDate, '00:00');
        const trimmedMessageContent = line.trim();
        const lowerMessageContent = trimmedMessageContent.toLowerCase();

        const uniqueTrimmedPlaceholders = [...new Set(mediaPlaceholders.map(p => p.trim()))];
        const isMediaPlaceholder = uniqueTrimmedPlaceholders.some(ph => lowerMessageContent.includes(ph));
        const isEditedMessage = lowerMessageContent.includes('<mensagem editada>') || lowerMessageContent.includes('<message edited>');
        const containsSystemKeyword = systemMessageKeywords.some(keyword => lowerMessageContent.includes(keyword) || lowerMessageContent === keyword.toLowerCase());
        const isSystem = isMediaPlaceholder || isEditedMessage || containsSystemKeyword;

        currentMessage = {
          timestamp: timestamp,
          sender: pendingSender, // Remetente já definido
          message: trimmedMessageContent,
          isSystemMessage: isSystem,
        };
        messages.push(currentMessage);

        pendingDate = null;
        pendingSender = null;

      } else if (currentMessage && !currentMessage.isSystemMessage && line.trim()) {
        // Esta linha é uma continuação da mensagem anterior (multi-linha)
        // console.log(`  Appending to previous message: ${line.trim().substring(0, 50)}...`);
        currentMessage.message += '\n' + line.trim();
      } else if (line.trim()) {
         // Linha não correspondeu a NENHUM padrão e não é continuação. Registra como skip.
         console.log(`Skipping unmatched line (line ${index + 1}, formatType=${formatType}): ${line}`);
      }
      // Ignora linhas que se tornaram vazias após trim (ou já eram vazias)
    } catch (error) {
       console.error(`Error processing line ${index + 1}: "${line}"`, error);
       // Continua para a próxima linha
       return;
    }
  });
  // --- End Processing Line ---

  console.log(`Finished parsing. Found ${messages.length} messages.`);
  return messages;
};

// ... (função parseWhatsAppDateTime permanece a mesma) ...

// Helper function to parse WhatsApp date/time with more flexibility
const parseWhatsAppDateTime = (dateStr: string, timeStr: string, period?: string): Date | null => {
  try {
    // Normalize date separators (replace . or - with /)
    const normalizedDateStr = dateStr.replace(/[.-]/g, '/');
    const dateParts = normalizedDateStr.split('/');

    // Validação básica das partes
    if (dateParts.length !== 3) {
        throw new Error(`Invalid date parts count: ${dateParts.length} in "${dateStr}"`);
    }

    let day: number, month: number, year: number;

    // Assume DD/MM/YY(YY) como padrão para PT/BR
    const part1 = parseInt(dateParts[0], 10);
    const part2 = parseInt(dateParts[1], 10);
    const part3 = parseInt(dateParts[2], 10);

    if (isNaN(part1) || isNaN(part2) || isNaN(part3)) {
        throw new Error(`Invalid date parts (NaN): ${part1}, ${part2}, ${part3} in "${dateStr}"`);
    }

    // Lógica DD/MM vs MM/DD (simplificada, assumindo DD/MM para > 12)
    if (part1 > 31 || part2 > 12) { // Verificação básica de validade
        console.warn(`Potentially ambiguous or invalid date format ${dateStr}. Assuming DD/MM.`);
        // Poderia tentar inverter se part1 <= 12 e part2 > 12, mas vamos manter DD/MM por padrão
    }

    day = part1;
    month = part2 - 1; // JS months são 0-indexed
    year = part3;

    // Handle YY vs YYYY year format
    if (year < 100) {
      year += 2000; // Assume século 21 para anos 00-99
    }

    // --- Time Parsing Logic ---
    let hours: number;
    let minutes: number;
    let seconds = 0; // Default seconds

    const timeParts = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([AP]M))?/i);
     if (!timeParts) {
         throw new Error(`Invalid time format: "${timeStr}"`);
     }

     hours = parseInt(timeParts[1], 10);
     minutes = parseInt(timeParts[2], 10);
     seconds = timeParts[3] ? parseInt(timeParts[3], 10) : 0;
     const ampm = period ? null : timeParts[4]?.toUpperCase(); // AM/PM só relevante se não houver 'period'

     if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || hours > 23 || minutes > 59 || seconds > 59) {
         throw new Error(`Invalid time components: H=${hours}, M=${minutes}, S=${seconds} in "${timeStr}"`);
     }


    if (period) { // Formato 2: HH:MM da [period]
      const lowerPeriod = period.toLowerCase();
      if ((lowerPeriod === 'noite' || lowerPeriod === 'tarde') && hours < 12) {
          hours += 12;
      } else if (lowerPeriod === 'manhã' && hours === 12) { // 12:xx da manhã -> 00:xx (meia-noite)
          hours = 0;
      }
      // Corrige 12 PM (meio-dia) caso o formato seja "12:xx da tarde"
      if (lowerPeriod === 'tarde' && hours === 12) {
          // hours permanece 12 (meio-dia)
      }
      // Horas como 13, 14 etc já estão em formato 24h, não precisam de ajuste com 'period'
    } else if (ampm) { // Formato Original com AM/PM
        if (hours === 12) { // Handle 12 AM (meia-noite) / 12 PM (meio-dia)
          hours = (ampm === 'AM') ? 0 : 12;
        } else if (ampm === 'PM') {
          hours += 12;
        }
    }
    // Se não houver 'period' nem 'ampm', assume-se formato 24h.

    // --- End Time Parsing Logic ---

    const resultDate = new Date(year, month, day, hours, minutes, seconds);

    // Validação final do objeto Date (checa se os componentes formaram uma data válida)
    if (isNaN(resultDate.getTime())) {
        throw new Error(`Failed to create valid Date object: Y=${year}, M=${month}, D=${day}, H=${hours}, Min=${minutes}, S=${seconds}`);
    }
     // Verificação adicional se os componentes correspondem (evita overflow, ex: dia 32 virando mês seguinte)
     if (resultDate.getFullYear() !== year || resultDate.getMonth() !== month || resultDate.getDate() !== day) {
        console.warn(`Date component mismatch after creation (potential overflow): Input D=${day}/M=${month+1}/Y=${year}, Created=${resultDate.toLocaleDateString()}`);
        // Poderia lançar erro ou retornar null dependendo da criticidade
     }


    return resultDate;

  } catch (error) {
    console.error(`Failed to parse date/time: date="${dateStr}", time="${timeStr}", period="${period || 'N/A'}"`, error);
    return null; // Retorna null em caso de erro no parsing
  }
};