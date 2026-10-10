import { useState } from 'react';
import { CalendarDays, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOptions } from '../context/OptionsContext';
import { ResourcePage } from '../components/ui/ResourcePage';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { DetailGrid } from '../components/ui/Misc';
import { formatDate, labelize } from '../utils/format';
import { isManager } from '../utils/roles';
import { useLanguage } from '../context/LanguageContext';

const att = (k) => ({ get: (r) => r.attendance?.[k], set: (o, v) => { o.attendance = { ...(o.attendance || {}), [k]: v }; } });

const MEETING_TEXT = {
  en: { title: 'Gram Sabha & Meetings', subtitle: 'Schedule meetings, publish agenda, record attendance and minutes', meeting: 'Meeting', titleField: 'Title', type: 'Meeting type', status: 'Status', date: 'Date & time', location: 'Location', agenda: 'Agenda (one item per line)', minutes: 'Minutes', decisions: 'Decisions / resolutions (one per line)', attendance: 'Attendance', total: 'Attendance — total', men: 'Attendance — men', women: 'Attendance — women', officials: 'Officials present (one per line)', visible: 'Visible to citizens', dateCol: 'Date', typeCol: 'Type', attendanceCol: 'Attendance', filtersType: 'Types', filtersStatus: 'Statuses', dateRange: 'Meeting date', dateFrom: 'from', dateTo: 'to', search: 'Search meetings…', view: 'View', noMeetings: 'No meetings found', noMeetingsMessage: 'There are no meetings matching your filters.', agendaTitle: 'Agenda', noAgenda: 'No agenda published.', minutesTitle: 'Minutes', decisionsTitle: 'Decisions', officialsPresent: 'Officials present', menShort: 'men', womenShort: 'women' },
  hi: { title: 'ग्राम सभा और बैठकें', subtitle: 'बैठकें निर्धारित करें, कार्यसूची प्रकाशित करें और उपस्थिति व कार्यवृत्त दर्ज करें', meeting: 'बैठक', titleField: 'शीर्षक', type: 'बैठक का प्रकार', status: 'स्थिति', date: 'दिनांक और समय', location: 'स्थान', agenda: 'कार्यसूची (प्रति पंक्ति एक मद)', minutes: 'कार्यवृत्त', decisions: 'निर्णय / प्रस्ताव (प्रति पंक्ति एक)', attendance: 'उपस्थिति', total: 'कुल उपस्थिति', men: 'पुरुष उपस्थिति', women: 'महिला उपस्थिति', officials: 'उपस्थित अधिकारी (प्रति पंक्ति एक)', visible: 'नागरिकों को दिखाई दे', dateCol: 'दिनांक', typeCol: 'प्रकार', attendanceCol: 'उपस्थिति', filtersType: 'प्रकार', filtersStatus: 'स्थितियाँ', dateRange: 'बैठक की तारीख', dateFrom: 'से', dateTo: 'तक', search: 'बैठकें खोजें…', view: 'देखें', noMeetings: 'कोई बैठक नहीं मिली', noMeetingsMessage: 'आपके फ़िल्टर से मेल खाने वाली कोई बैठक नहीं है।', agendaTitle: 'कार्यसूची', noAgenda: 'कोई कार्यसूची प्रकाशित नहीं है।', minutesTitle: 'कार्यवृत्त', decisionsTitle: 'निर्णय', officialsPresent: 'उपस्थित अधिकारी', menShort: 'पुरुष', womenShort: 'महिलाएँ' },
  ta: { title: 'கிராம சபை மற்றும் கூட்டங்கள்', subtitle: 'கூட்டங்களைத் திட்டமிட்டு, நிகழ்ச்சி நிரலை வெளியிட்டு, வருகை மற்றும் குறிப்புகளைப் பதிவு செய்யவும்', meeting: 'கூட்டம்', titleField: 'தலைப்பு', type: 'கூட்ட வகை', status: 'நிலை', date: 'தேதி மற்றும் நேரம்', location: 'இடம்', agenda: 'நிகழ்ச்சி நிரல் (ஒவ்வொரு வரியிலும் ஒன்று)', minutes: 'கூட்டக் குறிப்புகள்', decisions: 'முடிவுகள் / தீர்மானங்கள் (ஒவ்வொரு வரியிலும் ஒன்று)', attendance: 'வருகை', total: 'மொத்த வருகை', men: 'ஆண்கள் வருகை', women: 'பெண்கள் வருகை', officials: 'கலந்துகொண்ட அதிகாரிகள் (ஒவ்வொரு வரியிலும் ஒருவர்)', visible: 'பொதுமக்களுக்குக் காண்பிக்கவும்', dateCol: 'தேதி', typeCol: 'வகை', attendanceCol: 'வருகை', filtersType: 'வகைகள்', filtersStatus: 'நிலைகள்', dateRange: 'கூட்டத் தேதி', dateFrom: 'முதல்', dateTo: 'வரை', search: 'கூட்டங்களைத் தேடுங்கள்…', view: 'பார்க்க', noMeetings: 'கூட்டங்கள் இல்லை', noMeetingsMessage: 'உங்கள் வடிகட்டலுக்குப் பொருந்தும் கூட்டங்கள் இல்லை.', agendaTitle: 'நிகழ்ச்சி நிரல்', noAgenda: 'நிகழ்ச்சி நிரல் வெளியிடப்படவில்லை.', minutesTitle: 'கூட்டக் குறிப்புகள்', decisionsTitle: 'முடிவுகள்', officialsPresent: 'கலந்துகொண்ட அதிகாரிகள்', menShort: 'ஆண்கள்', womenShort: 'பெண்கள்' },
  te: { title: 'గ్రామ సభ మరియు సమావేశాలు', subtitle: 'సమావేశాలను షెడ్యూల్ చేసి, ఎజెండాను ప్రచురించి, హాజరు మరియు మినిట్స్ నమోదు చేయండి', meeting: 'సమావేశం', titleField: 'శీర్షిక', type: 'సమావేశ రకం', status: 'స్థితి', date: 'తేదీ మరియు సమయం', location: 'స్థలం', agenda: 'ఎజెండా (ఒక్కో పంక్తికి ఒక అంశం)', minutes: 'మినిట్స్', decisions: 'నిర్ణయాలు / తీర్మానాలు (ఒక్కో పంక్తికి ఒకటి)', attendance: 'హాజరు', total: 'మొత్తం హాజరు', men: 'పురుషుల హాజరు', women: 'మహిళల హాజరు', officials: 'హాజరైన అధికారులు (ఒక్కో పంక్తికి ఒకరు)', visible: 'పౌరులకు కనిపించాలి', dateCol: 'తేదీ', typeCol: 'రకం', attendanceCol: 'హాజరు', filtersType: 'రకాలు', filtersStatus: 'స్థితులు', dateRange: 'సమావేశ తేదీ', dateFrom: 'నుండి', dateTo: 'వరకు', search: 'సమావేశాలను వెతకండి…', view: 'చూడండి', noMeetings: 'సమావేశాలు కనబడలేదు', noMeetingsMessage: 'మీ ఫిల్టర్‌లకు సరిపోయే సమావేశాలు లేవు.', agendaTitle: 'ఎజెండా', noAgenda: 'ఎజెండా ప్రచురించబడలేదు.', minutesTitle: 'మినిట్స్', decisionsTitle: 'నిర్ణయాలు', officialsPresent: 'హాజరైన అధికారులు', menShort: 'పురుషులు', womenShort: 'మహిళలు' },
  kn: { title: 'ಗ್ರಾಮ ಸಭೆ ಮತ್ತು ಸಭೆಗಳು', subtitle: 'ಸಭೆಗಳನ್ನು ನಿಗದಿಪಡಿಸಿ, ಕಾರ್ಯಸೂಚಿ ಪ್ರಕಟಿಸಿ, ಹಾಜರಾತಿ ಮತ್ತು ನಡಾವಳಿಗಳನ್ನು ದಾಖಲಿಸಿ', meeting: 'ಸಭೆ', titleField: 'ಶೀರ್ಷಿಕೆ', type: 'ಸಭೆಯ ವಿಧ', status: 'ಸ್ಥಿತಿ', date: 'ದಿನಾಂಕ ಮತ್ತು ಸಮಯ', location: 'ಸ್ಥಳ', agenda: 'ಕಾರ್ಯಸೂಚಿ (ಪ್ರತಿ ಸಾಲಿಗೆ ಒಂದು ಅಂಶ)', minutes: 'ನಡಾವಳಿ', decisions: 'ನಿರ್ಧಾರಗಳು / ನಿರ್ಣಯಗಳು (ಪ್ರತಿ ಸಾಲಿಗೆ ಒಂದು)', attendance: 'ಹಾಜರಾತಿ', total: 'ಒಟ್ಟು ಹಾಜರಾತಿ', men: 'ಪುರುಷರ ಹಾಜರಾತಿ', women: 'ಮಹಿಳೆಯರ ಹಾಜರಾತಿ', officials: 'ಹಾಜರಿದ್ದ ಅಧಿಕಾರಿಗಳು (ಪ್ರತಿ ಸಾಲಿಗೆ ಒಬ್ಬರು)', visible: 'ನಾಗರಿಕರಿಗೆ ಕಾಣಿಸಲಿ', dateCol: 'ದಿನಾಂಕ', typeCol: 'ವಿಧ', attendanceCol: 'ಹಾಜರಾತಿ', filtersType: 'ವಿಧಗಳು', filtersStatus: 'ಸ್ಥಿತಿಗಳು', dateRange: 'ಸಭೆಯ ದಿನಾಂಕ', dateFrom: 'ಇಂದ', dateTo: 'ವರೆಗೆ', search: 'ಸಭೆಗಳನ್ನು ಹುಡುಕಿ…', view: 'ವೀಕ್ಷಿಸಿ', noMeetings: 'ಸಭೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ', noMeetingsMessage: 'ನಿಮ್ಮ ಫಿಲ್ಟರ್‌ಗಳಿಗೆ ಹೊಂದುವ ಸಭೆಗಳಿಲ್ಲ.', agendaTitle: 'ಕಾರ್ಯಸೂಚಿ', noAgenda: 'ಕಾರ್ಯಸೂಚಿ ಪ್ರಕಟಿಸಿಲ್ಲ.', minutesTitle: 'ನಡಾವಳಿ', decisionsTitle: 'ನಿರ್ಧಾರಗಳು', officialsPresent: 'ಹಾಜರಿದ್ದ ಅಧಿಕಾರಿಗಳು', menShort: 'ಪುರುಷರು', womenShort: 'ಮಹಿಳೆಯರು' },
  ml: { title: 'ഗ്രാമസഭയും യോഗങ്ങളും', subtitle: 'യോഗങ്ങൾ നിശ്ചയിച്ച് അജണ്ട പ്രസിദ്ധീകരിക്കുകയും ഹാജരും മിനിറ്റ്സും രേഖപ്പെടുത്തുകയും ചെയ്യുക', meeting: 'യോഗം', titleField: 'ശീർഷകം', type: 'യോഗത്തിന്റെ തരം', status: 'നില', date: 'തീയതിയും സമയവും', location: 'സ്ഥലം', agenda: 'അജണ്ട (ഓരോ വരിയിലും ഒരു ഇനം)', minutes: 'മിനിറ്റ്സ്', decisions: 'തീരുമാനങ്ങൾ / പ്രമേയങ്ങൾ (ഓരോ വരിയിലും ഒന്ന്)', attendance: 'ഹാജർ', total: 'ആകെ ഹാജർ', men: 'പുരുഷന്മാരുടെ ഹാജർ', women: 'സ്ത്രീകളുടെ ഹാജർ', officials: 'പങ്കെടുത്ത ഉദ്യോഗസ്ഥർ (ഓരോ വരിയിലും ഒരാൾ)', visible: 'പൗരന്മാർക്ക് കാണാം', dateCol: 'തീയതി', typeCol: 'തരം', attendanceCol: 'ഹാജർ', filtersType: 'തരങ്ങൾ', filtersStatus: 'നിലകൾ', dateRange: 'യോഗ തീയതി', dateFrom: 'മുതൽ', dateTo: 'വരെ', search: 'യോഗങ്ങൾ തിരയുക…', view: 'കാണുക', noMeetings: 'യോഗങ്ങളൊന്നും കണ്ടെത്തിയില്ല', noMeetingsMessage: 'നിങ്ങളുടെ ഫിൽട്ടറുകളുമായി പൊരുത്തപ്പെടുന്ന യോഗങ്ങളില്ല.', agendaTitle: 'അജണ്ട', noAgenda: 'അജണ്ട പ്രസിദ്ധീകരിച്ചിട്ടില്ല.', minutesTitle: 'മിനിറ്റ്സ്', decisionsTitle: 'തീരുമാനങ്ങൾ', officialsPresent: 'പങ്കെടുത്ത ഉദ്യോഗസ്ഥർ', menShort: 'പുരുഷന്മാർ', womenShort: 'സ്ത്രീകൾ' },
  mr: { title: 'ग्रामसभा आणि बैठका', subtitle: 'बैठका नियोजित करा, विषयपत्रिका प्रकाशित करा आणि उपस्थिती व इतिवृत्त नोंदवा', meeting: 'बैठक', titleField: 'शीर्षक', type: 'बैठकीचा प्रकार', status: 'स्थिती', date: 'दिनांक आणि वेळ', location: 'ठिकाण', agenda: 'विषयपत्रिका (प्रति ओळ एक मुद्दा)', minutes: 'इतिवृत्त', decisions: 'निर्णय / ठराव (प्रति ओळ एक)', attendance: 'उपस्थिती', total: 'एकूण उपस्थिती', men: 'पुरुष उपस्थिती', women: 'महिला उपस्थिती', officials: 'उपस्थित अधिकारी (प्रति ओळ एक)', visible: 'नागरिकांना दिसेल', dateCol: 'दिनांक', typeCol: 'प्रकार', attendanceCol: 'उपस्थिती', filtersType: 'प्रकार', filtersStatus: 'स्थिती', dateRange: 'बैठकीची तारीख', dateFrom: 'पासून', dateTo: 'पर्यंत', search: 'बैठका शोधा…', view: 'पहा', noMeetings: 'बैठका आढळल्या नाहीत', noMeetingsMessage: 'तुमच्या फिल्टरशी जुळणाऱ्या बैठका नाहीत.', agendaTitle: 'विषयपत्रिका', noAgenda: 'विषयपत्रिका प्रकाशित केलेली नाही.', minutesTitle: 'इतिवृत्त', decisionsTitle: 'निर्णय', officialsPresent: 'उपस्थित अधिकारी', menShort: 'पुरुष', womenShort: 'महिला' },
  bn: { title: 'গ্রামসভা ও সভা', subtitle: 'সভা নির্ধারণ করুন, আলোচ্যসূচি প্রকাশ করুন এবং উপস্থিতি ও কার্যবিবরণী লিখুন', meeting: 'সভা', titleField: 'শিরোনাম', type: 'সভার ধরন', status: 'অবস্থা', date: 'তারিখ ও সময়', location: 'স্থান', agenda: 'আলোচ্যসূচি (প্রতি লাইনে একটি বিষয়)', minutes: 'কার্যবিবরণী', decisions: 'সিদ্ধান্ত / প্রস্তাব (প্রতি লাইনে একটি)', attendance: 'উপস্থিতি', total: 'মোট উপস্থিতি', men: 'পুরুষ উপস্থিতি', women: 'মহিলা উপস্থিতি', officials: 'উপস্থিত কর্মকর্তা (প্রতি লাইনে একজন)', visible: 'নাগরিকদের জন্য দৃশ্যমান', dateCol: 'তারিখ', typeCol: 'ধরন', attendanceCol: 'উপস্থিতি', filtersType: 'ধরন', filtersStatus: 'অবস্থা', dateRange: 'সভার তারিখ', dateFrom: 'থেকে', dateTo: 'পর্যন্ত', search: 'সভা খুঁজুন…', view: 'দেখুন', noMeetings: 'কোনো সভা পাওয়া যায়নি', noMeetingsMessage: 'আপনার ফিল্টারের সঙ্গে মেলে এমন সভা নেই।', agendaTitle: 'আলোচ্যসূচি', noAgenda: 'আলোচ্যসূচি প্রকাশিত হয়নি।', minutesTitle: 'কার্যবিবরণী', decisionsTitle: 'সিদ্ধান্ত', officialsPresent: 'উপস্থিত কর্মকর্তা', menShort: 'পুরুষ', womenShort: 'মহিলা' },
};

const TYPE_LABELS = {
  GRAM_SABHA: { en: 'Gram Sabha', hi: 'ग्राम सभा', ta: 'கிராம சபை', te: 'గ్రామ సభ', kn: 'ಗ್ರಾಮ ಸಭೆ', ml: 'ഗ്രാമസഭ', mr: 'ग्रामसभा', bn: 'গ্রামসভা' },
  PANCHAYAT_MEETING: { en: 'Panchayat Meeting', hi: 'पंचायत बैठक', ta: 'ஊராட்சி கூட்டம்', te: 'పంచాయతీ సమావేశం', kn: 'ಪಂಚಾಯತ್ ಸಭೆ', ml: 'പഞ്ചായത്ത് യോഗം', mr: 'पंचायत बैठक', bn: 'পঞ্চায়েত সভা' },
  COMMITTEE_MEETING: { en: 'Committee Meeting', hi: 'समिति बैठक', ta: 'குழுக் கூட்டம்', te: 'కమిటీ సమావేశం', kn: 'ಸಮಿತಿ ಸಭೆ', ml: 'സമിതി യോഗം', mr: 'समिती बैठक', bn: 'কমিটি সভা' },
};

const STATUS_LABELS = {
  SCHEDULED: { en: 'Scheduled', hi: 'निर्धारित', ta: 'திட்டமிடப்பட்டது', te: 'షెడ్యూల్ చేయబడింది', kn: 'ನಿಗದಿಪಡಿಸಲಾಗಿದೆ', ml: 'നിശ്ചയിച്ചു', mr: 'नियोजित', bn: 'নির্ধারিত' },
  COMPLETED: { en: 'Completed', hi: 'पूर्ण', ta: 'நிறைவடைந்தது', te: 'పూర్తయింది', kn: 'ಪೂರ್ಣಗೊಂಡಿದೆ', ml: 'പൂർത്തിയായി', mr: 'पूर्ण', bn: 'সম্পন্ন' },
  CANCELLED: { en: 'Cancelled', hi: 'रद्द', ta: 'ரத்து செய்யப்பட்டது', te: 'రద్దు చేయబడింది', kn: 'ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ', ml: 'റദ്ദാക്കി', mr: 'रद्द', bn: 'বাতিল' },
  POSTPONED: { en: 'Postponed', hi: 'स्थगित', ta: 'ஒத்திவைக்கப்பட்டது', te: 'వాయిదా పడింది', kn: 'ಮುಂದೂಡಲಾಗಿದೆ', ml: 'മാറ്റിവച്ചു', mr: 'पुढे ढकलले', bn: 'স্থগিত' },
};

export default function Meetings() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const o = useOptions();
  const manage = isManager(user);
  const [viewing, setViewing] = useState(null);
  const words = MEETING_TEXT[language] || MEETING_TEXT.en;
  const text = (key) => words[key] || MEETING_TEXT.en[key] || key;
  const enumText = (value) => TYPE_LABELS[value]?.[language] || STATUS_LABELS[value]?.[language] || labelize(value);
  const fields = [
    { name: 'title', label: text('titleField'), required: true, span: 2 },
    { name: 'type', label: text('type'), type: 'select', options: (o.meetingTypes || []).map((value) => ({ value, label: enumText(value) })), required: true },
    { name: 'status', label: text('status'), type: 'select', options: (o.meetingStatuses || []).map((value) => ({ value, label: enumText(value) })), required: true, default: 'SCHEDULED' },
    { name: 'date', label: text('date'), type: 'datetime', required: true },
    { name: 'location', label: text('location'), default: 'Community Hall' },
    { name: 'agenda', label: text('agenda'), type: 'list', span: 2, rows: 4 },
    { name: 'minutes', label: text('minutes'), type: 'textarea', span: 2, rows: 4 },
    { name: 'decisions', label: text('decisions'), type: 'list', span: 2 },
    { name: 'attTotal', label: text('total'), type: 'number', min: 0, ...att('total') },
    { name: 'attMale', label: text('men'), type: 'number', min: 0, ...att('male') },
    { name: 'attFemale', label: text('women'), type: 'number', min: 0, ...att('female') },
    { name: 'officials', label: text('officials'), type: 'list', ...att('officials') },
    { name: 'isPublic', label: text('visible'), type: 'checkbox', default: true, span: 2 },
  ];
  const columns = [
    { key: 'date', label: text('dateCol'), render: (r) => <div className="whitespace-nowrap">{formatDate(r.date, true)}</div> },
    { key: 'title', label: text('meeting'), primary: true, render: (r) => <div><p className="font-medium text-slate-900">{r.title}</p><p className="text-xs text-slate-500">{r.location}</p></div> },
    { key: 'type', label: text('typeCol'), render: (r) => <StatusBadge value={r.type} label={enumText(r.type)} /> },
    { key: 'attendance', label: text('attendanceCol'), className: 'tabular-nums', render: (r) => (r.attendance?.total ? r.attendance.total : '—') },
    { key: 'status', label: text('status'), render: (r) => <StatusBadge value={r.status} label={enumText(r.status)} /> },
  ];
  return (
    <>
      <ResourcePage title={text('title')} subtitle={text('subtitle')} icon={CalendarDays}
        endpoint="/meetings" entityName={text('meeting')} columns={columns} formFields={manage ? fields : undefined}
        filters={[{ name: 'type', label: text('filtersType'), options: (o.meetingTypes || []).map((value) => ({ value, label: enumText(value) })) }, { name: 'status', label: text('filtersStatus'), options: (o.meetingStatuses || []).map((value) => ({ value, label: enumText(value) })) }]}
        dateRange={text('dateRange')} dateFromLabel={text('dateFrom')} dateToLabel={text('dateTo')} searchPlaceholder={text('search')} canCreate={manage} canEdit={manage} canDelete={manage} onRowClick={setViewing}
        emptyState={{ title: text('noMeetings'), message: text('noMeetingsMessage') }}
        extraActions={(r) => <button className="btn-secondary btn-sm" onClick={() => setViewing(r)} aria-label={text('view')}><Eye className="h-3.5 w-3.5" /><span className="md:sr-only">{text('view')}</span></button>}
        csv={[{ label: text('dateCol'), value: (r) => formatDate(r.date, true) }, { label: text('titleField'), value: (r) => r.title }, { label: text('typeCol'), value: (r) => enumText(r.type) }, { label: text('location'), value: (r) => r.location },
          { label: text('attendanceCol'), value: (r) => r.attendance?.total }, { label: text('status'), value: (r) => enumText(r.status) }]} />
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.title || ''}>
        {viewing && (
          <div className="space-y-5">
            <div className="flex gap-2"><StatusBadge value={viewing.type} label={enumText(viewing.type)} /><StatusBadge value={viewing.status} label={enumText(viewing.status)} /></div>
            <DetailGrid items={[[text('date'), formatDate(viewing.date, true)], [text('location'), viewing.location], [text('type'), enumText(viewing.type)],
              [text('attendance'), viewing.attendance?.total ? `${viewing.attendance.total} (${text('menShort')} ${viewing.attendance.male}, ${text('womenShort')} ${viewing.attendance.female})` : '—']]} />
            <section><h3 className="mb-1.5 text-sm font-semibold text-slate-800">{text('agendaTitle')}</h3>
              {viewing.agenda?.length ? <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">{viewing.agenda.map((a, i) => <li key={i}>{a}</li>)}</ol> : <p className="text-sm text-slate-500">{text('noAgenda')}</p>}
            </section>
            {viewing.minutes && <section><h3 className="mb-1.5 text-sm font-semibold text-slate-800">{text('minutesTitle')}</h3><p className="whitespace-pre-line text-sm text-slate-700">{viewing.minutes}</p></section>}
            {viewing.decisions?.length > 0 && <section><h3 className="mb-1.5 text-sm font-semibold text-slate-800">{text('decisionsTitle')}</h3><ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{viewing.decisions.map((d, i) => <li key={i}>{d}</li>)}</ul></section>}
            {viewing.attendance?.officials?.length > 0 && <p className="text-sm text-slate-600"><b>{text('officialsPresent')}:</b> {viewing.attendance.officials.join(', ')}</p>}
          </div>
        )}
      </Modal>
    </>
  );
}
