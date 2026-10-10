/**
 * Multilingual AI Panchayat Chatbot Controller
 * Understands and responds in all 8 supported languages:
 * English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali.
 * Integrates directly with real MySQL data (grievances, announcements, services, meetings).
 */
const M = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const { normalizeLanguage, localizeAnnouncements, localizeServices } = require('../services/translationService');

const RESPONSES = {
  welcome: {
    en: 'Namaste! I am your E-GramSwaraj+ Virtual Assistant. You can ask me about village announcements, Gram Sabha meetings, development works, citizen services, or check the status of your applications.',
    ta: 'வணக்கம்! நான் உங்கள் இ-கிராம்ஸ்வராஜ்+ மெய்நிகர் உதவியாளர். கிராம அறிவிப்புகள், கிராம சபை கூட்டங்கள், வளர்ச்சிப் பணிகள், குடிமக்கள் சேவைகள் அல்லது உங்கள் விண்ணப்பங்களின் நிலையை என்னிடம் கேட்கலாம்.',
    hi: 'नमस्ते! मैं आपका ई-ग्रामस्वराज+ आभासी सहायक हूँ। आप मुझसे ग्राम घोषणाओं, ग्राम सभा की बैठकों, विकास कार्यों, नागरिक सेवाओं या अपने आवेदनों की स्थिति के बारे में पूछ सकते हैं।',
    te: 'నమస్కారం! నేను మీ ఇ-గ్రామ్స్వరాజ్+ వర్చువల్ అసిస్టెంట్‌ని. మీరు నన్ను గ్రామ ప్రకటనలు, గ్రామసభ సమావేశాలు, అభివృద్ధి పనులు, పౌర సేవలు లేదా మీ దరఖాస్తుల స్థితి గురించి అడగవచ్చు.',
    kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಇ-ಗ್ರಾಮ್‌ಸ್ವರಾಜ್+ ಸಹಾಯಕ. ಗ್ರಾಮದ ಪ್ರಕಟಣೆಗಳು, ಗ್ರಾಮ ಸಭೆ, ಅಭಿವೃದ್ಧಿ ಕಾಮಗಾರಿಗಳು ಅಥವಾ ನಿಮ್ಮ ಅರ್ಜಿಗಳ ಸ್ಥಿತಿಯ ಬಗ್ಗೆ ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದು.',
    ml: 'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ ഇ-ഗ്രാംസ്വരാജ്+ വെർച്വൽ അസിസ്റ്റന്റാണ്. ഗ്രാമ അറിയിപ്പുകൾ, ഗ്രാമസഭ, വികസന പ്രവർത്തനങ്ങൾ അല്ലെങ്കിൽ നിങ്ങളുടെ അപേക്ഷകളുടെ നില എന്നിവയെക്കുറിച്ച് എന്നോട് ചോദിക്കാം.',
    mr: 'नमस्कार! मी आपला ई-ग्रामस्वराज+ व्हर्च्युअल सहाय्यक आहे. आपण मला ग्रामपंचायत घोषणा, ग्रामसभा, विकासकामे किंवा आपल्या अर्जाच्या स्थितीबद्दल विचारू शकता.',
    bn: 'নমস্কার! আমি আপনার ই-গ্রামস্বরাজ+ সহকারী। আপনি আমাকে পঞ্চায়েতের বিজ্ঞপ্তি, গ্রামসভা, উন্নয়নমূলক কাজ বা আপনার আবেদনের অবস্থা সম্পর্কে জিজ্ঞাসা করতে পারেন।',
  },
  noGrievanceFound: {
    en: 'You do not have any active grievances registered in the system right now. You can submit a new grievance from the Citizen Services menu.',
    ta: 'தற்போது உங்கள் பெயரில் நிலுவையில் உள்ள புகார்கள் எதுவும் இல்லை. குடிமக்கள் சேவைகள் பிரிவில் புதிய புகாரை நீங்கள் பதிவு செய்யலாம்.',
    hi: 'वर्तमान में आपके नाम पर कोई सक्रिय शिकायत दर्ज नहीं है। आप नागरिक सेवा अनुभाग से नई शिकायत दर्ज कर सकते हैं।',
    te: 'ప్రస్తుతం మీ ఖాతాలో ఎటువంటి పెండింగ్ ఫిర్యాదులు లేవు. మీరు పౌర సేవల మెను నుండి కొత్త ఫిర్యాదును సమర్పించవచ్చు.',
    kn: 'ಪ್ರಸ್ತುತ ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ ಯಾವುದೇ ಬಾಕಿ ಇರುವ ದೂರುಗಳಿಲ್ಲ. ನೀವು ನಾಗರಿಕ ಸೇವೆಗಳ ವಿಭಾಗದಿಂದ ಹೊಸ ದೂರನ್ನು ಸಲ್ಲಿಸಬಹುದು.',
    ml: 'നിലവിൽ നിങ്ങളുടെ പേരിൽ പരാതികളൊന്നും രജിസ്റ്റർ ചെയ്തിട്ടില്ല. സിറ്റിസൺ സർവീസസ് വഴി നിങ്ങൾക്ക് പുതിയ പരാതി സമർപ്പിക്കാം.',
    mr: 'सध्या आपल्या नावावर कोणतीही तक्रार प्रलंबित नाही. आपण नागरिक सेवा मेनूमधून नवीन तक्रार नोंदवू शकता.',
    bn: 'বর্তমানে আপনার নামে কোনো সক্রিয় অভিযোগ নিবন্ধিত নেই। আপনি নাগরিক পরিষেবা মেনু থেকে নতুন অভিযোগ দায়ের করতে পারেন।',
  },
  generalHelp: {
    en: 'I can assist you with:\n1. Application & grievance status\n2. Upcoming Gram Sabha meetings\n3. Water connection & citizen services\n4. Village development updates\nHow may I help you today?',
    ta: 'நான் உங்களுக்கு பின்வருவனவற்றில் உதவ முடியும்:\n1. விண்ணப்பம் & புகார் நிலை\n2. வரவிருக்கும் கிராம சபைக் கூட்டங்கள்\n3. குடிநீர் இணைப்பு & ஊராட்சி சேவைகள்\n4. கிராம வளர்ச்சி பணிகள் பற்றிய தகவல்கள்\nஇன்று உங்களுக்கு எவ்வாறு உதவ வேண்டும்?',
    hi: 'मैं आपकी सहायता कर सकता हूँ:\n1. आवेदन एवं शिकायत की स्थिति\n2. आगामी ग्राम सभा बैठकें\n3. नल जल कनेक्शन एवं नागरिक सेवाएं\n4. ग्राम विकास कार्यों की जानकारी\nआज मैं आपकी क्या सहायता कर सकता हूँ?',
    te: 'నేను మీకు సహాయం చేయగలను:\n1. దరఖాస్తు మరియు ఫిర్యాదుల స్థితి\n2. రాబోయే గ్రామసభ సమావేశాలు\n3. తాగునీటి కుళాయి కనెక్షన్ మరియు సేవలు\n4. గ్రామ అభివృద్ధి పనుల వివరాలు\nనేను మీకు ఎలా సహాయపడగలను?',
    kn: 'ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ:\n1. ಅರ್ಜಿ ಮತ್ತು ದೂರಿನ ಸ್ಥಿತಿ\n2. ಮುಂಬರುವ ಗ್ರಾಮ ಸಭೆಯ ವಿವರಗಳು\n3. ಕುಡಿಯುವ ನೀರಿನ ನಲ್ಲಿ ಸಂಪರ್ಕ ಮತ್ತು ಸೇವೆಗಳು\n4. ಗ್ರಾಮದ ಅಭಿವೃದ್ಧಿ ಕಾಮಗಾರಿಗಳ ಮಾಹಿತಿ\nನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
    ml: 'എനിക്ക് സഹായിക്കാൻ കഴിയും:\n1. അപേക്ഷകളുടെയും പരാതികളുടെയും നില\n2. ഗ്രാമസഭാ യോഗ വിവരങ്ങൾ\n3. കുടിവെള്ള കണക്ഷൻ & മറ്റ് സേവനങ്ങൾ\n4. ഗ്രാമ വികസന പ്രവർത്തനങ്ങൾ\nഇന്ന് ഞാൻ എങ്ങനെ സഹായിക്കണം?',
    mr: 'मी आपल्याला खालील बाबींमध्ये मदत करू शकतो:\n1. अर्ज व तक्रार स्थिती\n2. आगामी ग्रामसभा बैठका\n3. नळ जोडणी व नागरिक सेवा\n4. गाव विकास कामांची माहिती\nमी आज आपली काय मदत करू शकतो?',
    bn: 'আমি আপনাকে সাহায্য করতে পারি:\n1. আবেদন ও অভিযোগের বর্তমান অবস্থা\n2. আসন্ন গ্রামসভা বৈঠকের তথ্য\n3. জল সংযোগ ও নাগরিক পরিষেবা\n4. গ্রাম উন্নয়নমূলক কাজের অগ্রগতি\nআজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
  },
};

exports.chat = asyncHandler(async (req, res) => {
  const { message = '' } = req.body;
  const lang = normalizeLanguage(req.body.language || req.query.language || req.headers['accept-language'] || req.user?.language);
  const villageId = req.villageId;
  const user = req.user;
  const msgLower = message.toLowerCase().trim();

  // Pattern checks across scripts
  const isGrievanceOrAppQuery =
    /status|application|grievance|complaint|நிலை|விண்ணப்ப|புகார்|स्थिति|शिकायत|आवेदन|స్థితి|దరఖాస్తు|ఫిర్యాదు|ಸ್ಥಿತಿ|ದೂರು|ಅರ್ಜಿ|നില|പരാതി|അപേക്ഷ|स्थिती|तक्रार|अर्ज|অবস্থা|অভিযোগ|আবেদন/i.test(msgLower);

  const isAnnouncementQuery =
    /announcement|notice|gram sabha|meeting|அறிவிப்பு|கிராம சபை|கூட்டம்|घोषणा|ग्राम सभा|बैठक|ప్రకటన|గ్రామ సభ|సమావేశం|ಪ್ರಕಟಣೆ|ಗ್ರಾಮ ಸಭೆ|ಸಭೆ|അറിയിപ്പ്|ഗ്രാമസഭ|യോഗം|घोषणा|ग्रामसभा|বিজ্ঞপ্তি|গ্রামসভা/i.test(msgLower);

  const isWaterOrServiceQuery =
    /water|service|tap|connection|குடிநீர்|சேவை|வரி|जल|पानी|नल|सेवा|నీరు|కుళాయి|సేవ|ನೀರು|ನಲ್ಲಿ|ಸೇವೆ|വെള്ളം|കുടിവെള്ളം|സേവനം|पाणी|नळ|सेवा|জল|নল|পরিষেবা/i.test(msgLower);

  // 1. Grievance Status Query
  if (isGrievanceOrAppQuery) {
    const latestGrievance = await M.Grievance.findOne({
      villageId,
      submittedBy: user._id,
    }).sort('-createdAt');

    if (!latestGrievance) {
      return ok(res, {
        reply: RESPONSES.noGrievanceFound[lang] || RESPONSES.noGrievanceFound.en,
        language: lang,
      });
    }

    const ref = latestGrievance.referenceNumber || 'GRV-001';
    const status = latestGrievance.status;
    const cat = latestGrievance.category;

    const replies = {
      en: `Your latest grievance (${ref} – ${cat}) is currently in "${status}" status. Our village team is actively processing it.`,
      ta: `உங்கள் விண்ணப்பம்/புகார் எண் ${ref} (${cat}) தற்போது "${status}" நிலையில் உள்ளது. ஊராட்சி நிர்வாகம் இதை பரிசீலித்து வருகிறது.`,
      hi: `आपका नवीनतम अनुरोध/शिकायत (${ref} – ${cat}) वर्तमान में "${status}" स्थिति में है। पंचायत प्रशासन द्वारा इस पर कार्रवाई की जा रही है।`,
      te: `మీ తాజా ఫిర్యాదు/దరఖాస్తు (${ref} – ${cat}) ప్రస్తుతం "${status}" స్థితిలో ఉంది. పంచాయతీ అధికారులు దీనిపై పని చేస్తున్నారు.`,
      kn: `ನಿಮ್ಮ ಇತ್ತೀಚಿನ ಅರ್ಜಿ/ದೂರು (${ref} – ${cat}) ಪ್ರಸ್ತುತ "${status}" ಸ್ಥಿತಿಯಲ್ಲಿದೆ. ಪಂಚಾಯಿತಿ ತಂಡವು ಪರಿಶೀಲಿಸುತ್ತಿದೆ.`,
      ml: `നിങ്ങളുടെ ഏറ്റവും പുതിയ അപേക്ഷ/പരാതി (${ref} – ${cat}) നിലവിൽ "${status}" അവസ്ഥയിലാണ്. പഞ്ചായത്ത് ഉദ്യോഗസ്ഥർ ഇത് പരിശോധിച്ചു വരുന്നു.`,
      mr: `आपली तक्रार/अर्ज (${ref} – ${cat}) सद्यस्थितीत "${status}" स्थितीत आहे. ग्रामपंचायत स्तरावर यावर कार्यवाही सुरू आहे.`,
      bn: `আপনার সাম্প্রতিক আবেদন/অভিযোগ (${ref} – ${cat}) বর্তমানে "${status}" অবস্থায় রয়েছে। পঞ্চায়েত প্রশাসন এটি খতিয়ে দেখছে।`,
    };

    return ok(res, {
      reply: replies[lang] || replies.en,
      data: {
        referenceNumber: ref,
        status,
        category: cat,
      },
      language: lang,
    });
  }

  // 2. Announcements or Gram Sabha Query
  if (isAnnouncementQuery) {
    const rawAnnouncements = await M.Announcement.find({
      villageId,
      status: 'PUBLISHED',
    }).sort('-pinned -publishDate').limit(3);

    const localized = await localizeAnnouncements(rawAnnouncements, lang);
    const top = localized[0];

    if (!top) {
      const emptyReplies = {
        en: 'There are no active announcements at this moment.',
        ta: 'தற்போது புதிய அறிவிப்புகள் எதுவும் இல்லை.',
        hi: 'इस समय कोई सक्रिय घोषणा उपलब्ध नहीं है।',
        te: 'ప్రస్తుతం ఎటువంటి కొత్త ప్రకటనలు లేవు.',
        kn: 'ಪ್ರಸ್ತುತ ಯಾವುದೇ ಸಕ್ರಿಯ ಪ್ರಕಟಣೆಗಳಿಲ್ಲ.',
        ml: 'ഇപ്പോൾ പുതിയ അറിയിപ്പുകൾ ലഭ്യമല്ല.',
        mr: 'सध्या कोणतीही नवीन घोषणा उपलब्ध नाही.',
        bn: 'এই মুহূর্তে কোনো নতুন বিজ্ঞপ্তি নেই।',
      };
      return ok(res, { reply: emptyReplies[lang] || emptyReplies.en, language: lang });
    }

    const replies = {
      en: `📢 Latest Announcement: "${top.title}"\n${top.description}`,
      ta: `📢 முக்கிய அறிவிப்பு: "${top.title}"\n${top.description}`,
      hi: `📢 नवीनतम घोषणा: "${top.title}"\n${top.description}`,
      te: `📢 ముఖ్య ప్రకటన: "${top.title}"\n${top.description}`,
      kn: `📢 ಇತ್ತೀಚಿನ ಪ್ರಕಟಣೆ: "${top.title}"\n${top.description}`,
      ml: `📢 പുതിയ അറിയിപ്പ്: "${top.title}"\n${top.description}`,
      mr: `📢 महत्त्वाची घोषणा: "${top.title}"\n${top.description}`,
      bn: `📢 সাম্প্রতিক বিজ্ঞপ্তি: "${top.title}"\n${top.description}`,
    };

    return ok(res, {
      reply: replies[lang] || replies.en,
      data: top,
      language: lang,
    });
  }

  // 3. Water or Services Query
  if (isWaterOrServiceQuery) {
    const services = await M.Service.find({ villageId, status: 'ACTIVE' }).limit(3);
    const localized = await localizeServices(services, lang);
    const waterService = localized.find((s) => s.code === 'SRV-WATER') || localized[0];

    const replies = {
      en: waterService
        ? `Drinking Water Connection (JJM): ${waterService.name}.\n${waterService.description}\nFee: ₹${waterService.fee || 150}. Required: Aadhaar Card, Property Tax Receipt.`
        : 'You can apply for drinking water connections and citizen services under the Services menu.',
      ta: waterService
        ? `குடிநீர் குழாய் இணைப்பு (JJM): ${waterService.name}.\n${waterService.description}\nகட்டணம்: ₹${waterService.fee || 150}. தேவையான ஆவணங்கள்: ஆதார் அட்டை, சொத்து வரி ரசீது.`
        : 'ஊராட்சி சேவைகள் பிரிவில் குடிநீர் இணைப்பு மற்றும் பிற சேவைகளுக்கு விண்ணப்பிக்கலாம்.',
      hi: waterService
        ? `पेयजल नल कनेक्शन (JJM): ${waterService.name}.\n${waterService.description}\nशुल्क: ₹${waterService.fee || 150}। आवश्यक दस्तावेज: आधार कार्ड, संपत्ति कर रसीद।`
        : 'आप नागरिक सेवा मेनू से पेयजल कनेक्शन और अन्य सेवाओं के लिए आवेदन कर सकते हैं।',
      te: waterService
        ? `తాగునీటి కుళాయి కనెక్షన్ (JJM): ${waterService.name}.\n${waterService.description}\nఫీజు: ₹${waterService.fee || 150}. అవసరమైన పత్రాలు: ఆధార్ కార్డు, పన్ను రసీదు.`
        : 'పౌర సేవల మెను నుండి తాగునీటి కనెక్షన్ మరియు ఇతర సేవల కోసం దరఖాస్తు చేసుకోవచ్చు.',
      kn: waterService
        ? `ಕುಡಿಯುವ ನೀರಿನ ಸಂಪರ್ಕ (JJM): ${waterService.name}.\n${waterService.description}\nಶುಲ್ಕ: ₹${waterService.fee || 150}. ದಾಖಲೆಗಳು: ಆಧಾರ್ ಕಾರ್ಡ್, ತೆರಿಗೆ ರಶೀದಿ.`
        : 'ನಾಗರಿಕ ಸೇವೆಗಳ ವಿಭಾಗದಿಂದ ಕುಡಿಯುವ ನೀರಿನ ಸಂಪರ್ಕಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು.',
      ml: waterService
        ? `കുടിവെള്ള കണക്ഷൻ (JJM): ${waterService.name}.\n${waterService.description}\nഫീസ്: ₹${waterService.fee || 150}. ആവശ്യമായ രേഖകൾ: ആധാർ കാർഡ്, നികുതി രസീത്.`
        : 'സിറ്റിസൺ സർവീസസ് വഴി കുടിവെള്ള കണക്ഷനും മറ്റ് സേവനങ്ങൾക്കും അപേക്ഷിക്കാം.',
      mr: waterService
        ? `पिण्याच्या पाण्याचे नळ जोडणी (JJM): ${waterService.name}.\n${waterService.description}\nशुल्क: ₹${waterService.fee || 150}. आवश्यक कागदपत्रे: आधार कार्ड, कर पावती.`
        : 'आपण नागरिक सेवा मेनूमधून नळ जोडणीसाठी अर्ज करू शकता.',
      bn: waterService
        ? `পানীয় জলের নল সংযোগ (JJM): ${waterService.name}।\n${waterService.description}\nফি: ₹${waterService.fee || 150}। প্রয়োজনীয় নথি: আধার কার্ড, করের রসিদ।`
        : 'আপনি নাগরিক পরিষেবা মেনু থেকে পানীয় জল সংযোগের জন্য আবেদন করতে পারেন।',
    };

    return ok(res, {
      reply: replies[lang] || replies.en,
      data: waterService,
      language: lang,
    });
  }

  // 4. Fallback General Assistance
  const fallback = RESPONSES.generalHelp[lang] || RESPONSES.generalHelp.en;
  return ok(res, {
    reply: fallback,
    language: lang,
  });
});
