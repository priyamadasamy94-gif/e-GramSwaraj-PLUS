import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FilePlus2, Search, CheckCircle2, Copy } from 'lucide-react';
import { useOptions } from '../context/OptionsContext';
import { useFetch } from '../hooks/useFetch';
import { useLanguage } from '../context/LanguageContext';
import { get, post } from '../services/api';
import { Card, PageHeader, DetailGrid } from '../components/ui/Misc';
import { FormFields, serialize, validate } from '../components/ui/Form';
import { AsyncBoundary, Spinner, ErrorState } from '../components/ui/Feedback';
import { StatusBadge } from '../components/ui/Badge';
import { GrievanceStepper, GrievanceTimeline } from './Grievances';
import { WhatsAppButton } from '../components/ui/WhatsAppButton';
import { formatDate } from '../utils/format';

const LANGUAGE_TEXT = {
  en: {
    title: 'Submit a Grievance',
    subtitle: 'Report a problem to the South Thittankulam Village Panchayat',
    category: 'Category',
    priority: 'How urgent is it?',
    subject: 'Subject',
    subjectPlaceholder: 'e.g. Street light not working near school',
    description: 'Describe the problem',
    location: 'Location / landmark',
    ward: 'Ward',
    submit: 'Submit grievance',
    successTitle: 'Grievance submitted',
    successMessage: 'Please note your reference number to track the status.',
    trackThis: 'Track this grievance',
    submitAnother: 'Submit another',
    copyReference: 'Copy reference number',
    trackTitle: 'Track Grievance',
    trackSubtitle: 'Enter your reference number, e.g. STK-GRV-2026-0001',
    track: 'Track',
    referenceNumber: 'Reference number',
    timeline: 'Timeline',
    myGrievances: 'My grievances',
    noGrievances: 'No grievances yet',
    noGrievancesMessage: 'Grievances you submit will appear here.',
    submitLink: 'Submit a grievance',
    submitted: 'Submitted',
    status: 'Status',
    handledBy: 'Handled by',
    resolvedClosed: 'Resolved / closed',
    resolution: 'Resolution',
  },
  hi: {
    title: 'शिकायत दर्ज करें',
    subtitle: 'दक्षिण थित्तंकुलम ग्राम पंचायत के समक्ष कोई समस्या दर्ज करें',
    category: 'श्रेणी',
    priority: 'यह कितनी जल्दी है?',
    subject: 'विषय',
    subjectPlaceholder: 'उदाहरण: स्कूल के पास स्ट्रीटलाइट नहीं जल रही',
    description: 'समस्या का वर्णन करें',
    location: 'स्थान / स्थलचिह्न',
    ward: 'वार्ड',
    submit: 'शिकायत भेजें',
    successTitle: 'शिकायत दर्ज हो गई',
    successMessage: 'कृपया अपने संदर्भ नंबर को सुरक्षित रखें ताकि स्थिति देखें।',
    trackThis: 'इस शिकायत को ट्रैक करें',
    submitAnother: 'और दर्ज करें',
    copyReference: 'संदर्भ नंबर कॉपी करें',
    trackTitle: 'शिकायत ट्रैक करें',
    trackSubtitle: 'अपना संदर्भ नंबर दर्ज करें, उदाहरण: STK-GRV-2026-0001',
    track: 'ट्रैक',
    referenceNumber: 'संदर्भ नंबर',
    timeline: 'समयरेखा',
    myGrievances: 'मेरी शिकायतें',
    noGrievances: 'अभी कोई शिकायत नहीं',
    noGrievancesMessage: 'आपकी दर्ज शिकायतें यहाँ दिखाई देंगी।',
    submitLink: 'शिकायत दर्ज करें',
    submitted: 'दर्ज की गई',
    status: 'स्थिति',
    handledBy: 'प्रबंधित किया गया',
    resolvedClosed: 'सुलझा / बंद',
    resolution: 'समाधान',
  },
  ta: {
    title: 'புகார் சமர்ப்பிக்க',
    subtitle: 'தெற்கு தித்தங்குளம் கிராமப் பஞ்சாயத்துக்கு பிரச்சனையை தெரிவிக்கவும்',
    category: 'வகை',
    priority: 'எவ்வளவு அவசரம்?',
    subject: 'தலைப்பு',
    subjectPlaceholder: 'எ.கா. பள்ளிக்கு அருகில் தெரு விளக்கு எரியவில்லை',
    description: 'சிக்கலை விவரிக்கவும்',
    location: 'இடம் / அடையாளம்',
    ward: 'வார்டு',
    submit: 'புகார் சமர்ப்பிக்க',
    successTitle: 'புகார் சமர்ப்பிக்கப்பட்டது',
    successMessage: 'உங்கள் குறிப்புப் எண்ணை நினைவில் வைத்துக் கொள்ளவும்.',
    trackThis: 'இந்த புகாரை கண்காணிக்க',
    submitAnother: 'மற்றொரு புகார்',
    copyReference: 'குறிப்பு எண்ணை நகலெடு',
    trackTitle: 'புகாரைக் கண்காணிக்க',
    trackSubtitle: 'உங்கள் குறிப்புப் எண்ணை உள்ளிடவும், உதாரணம்: STK-GRV-2026-0001',
    track: 'கண்காணி',
    referenceNumber: 'குறிப்பு எண்',
    timeline: 'நேர வரிசை',
    myGrievances: 'எனது புகார்கள்',
    noGrievances: 'இதுவரை புகார்கள் இல்லை',
    noGrievancesMessage: 'நீங்கள் சமர்ப்பிக்கும் புகார்கள் இங்கே காட்டப்படும்.',
    submitLink: 'புகார் சமர்ப்பிக்க',
    submitted: 'சமர்ப்பிக்கப்பட்டது',
    status: 'நிலை',
    handledBy: 'கையாளப்பட்டது',
    resolvedClosed: 'தீர்க்கப்பட்டது / மூடப்பட்டது',
    resolution: 'தீர்வு',
  },
  te: {
    title: 'షికायतను సమర్పించండి',
    subtitle: 'దక్షిణ తిట్టంకుళం గ్రామ పంచాయతీకి సమస్యను నివేదించండి',
    category: 'వర్గం',
    priority: 'ఇది ఎంత అత్యవసరం?',
    subject: 'విషయం',
    subjectPlaceholder: 'ఉదాహరణ: పాఠశాల దగ్గర వీధి లైటు పనిచేయడం లేదు',
    description: 'సమస్యను వివరించండి',
    location: 'స్థానం / ముఖ్య సూచన',
    ward: 'వార్డు',
    submit: 'షికాయతను సమర్పించండి',
    successTitle: 'షికాయత సమర్పించబడింది',
    successMessage: 'స్థితిని ట్రాక్ చేయడానికి మీ సూచన సంఖ్యను రికార్డ్ చేసుకోండి.',
    trackThis: 'ఈ షికాయతను ట్రాక్ చేయండి',
    submitAnother: 'మరోది సమర్పించండి',
    copyReference: 'సూచన సంఖ్యను కాపీ చేయండి',
    trackTitle: 'షికాయతను ట్రాక్ చేయండి',
    trackSubtitle: 'మీ సూచన సంఖ్యను నమోదు చేయండి, ఉదాహరణ: STK-GRV-2026-0001',
    track: 'ట్రాక్',
    referenceNumber: 'సూచన సంఖ్య',
    timeline: 'కాలక్రమం',
    myGrievances: 'నా షికాయతలు',
    noGrievances: 'ఇంకా షికాయతలు లేవు',
    noGrievancesMessage: 'మీరు సమర్పించిన షికాయతలు ఇక్కడ दिखाईిస్తాయి.',
    submitLink: 'షికాయతను సమర్పించండి',
    submitted: 'సమర్పించబడింది',
    status: 'స్థితి',
    handledBy: 'చే నిర్వహించబడింది',
    resolvedClosed: 'పరిష్కరించబడింది / ముగించబడింది',
    resolution: 'పరిష్కారం',
  },
  kn: {
    title: 'ತೊಂದರೆಯನ್ನು ಸಲ್ಲಿಸಿ',
    subtitle: 'ದಕ್ಷಿಣ ತಿಟ್ಟಂಕುಲಂ ಗ್ರಾಮಪಂಚಾಯತಿಗೆ ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ',
    category: 'ವರ್ಗ',
    priority: 'ಇದಕ್ಕೆ ಎಷ್ಟು ತುರ್ತುಗಾಲ?',
    subject: 'ವಿಷಯ',
    subjectPlaceholder: 'ಉದಾಹರಣೆಗೆ: ಶಾಲೆಗೆ ಹತ್ತಿರದ ರಸ್ತೆಯ ಬಿದಿರಿನ ದೀಪ ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ',
    description: 'ಸಮಸ್ಯವನ್ನು ವಿವರಿಸಿ',
    location: 'ಸ್ಥಳ / ಗುರುತು',
    ward: 'ವಾರ್ಡ್',
    submit: 'ತೊಂದರೆಯನ್ನು ಸಲ್ಲಿಸಿ',
    successTitle: 'ತೊಂದರೆ ಸಲ್ಲಿಸಲಾಗಿದೆ',
    successMessage: 'ಸ್ಥಿತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ನಿಮ್ಮ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆಯನ್ನು ನೆನಪಿಟ್ಟುಕೊಳ್ಳಿ.',
    trackThis: 'ಈ ಸಮಸ್ಯೆಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    submitAnother: 'ಮತ್ತೆ ಸಲ್ಲಿಸಿ',
    copyReference: 'ಉಲ್ಲೇಖ ಸಂಖ್ಯೆಯನ್ನು ನಕಲಿಸಿ',
    trackTitle: 'ತೊಂದರೆಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    trackSubtitle: 'ನಿಮ್ಮ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ, ಉದಾಹರಣೆ: STK-GRV-2026-0001',
    track: 'ಟ್ರ್ಯಾಕ್',
    referenceNumber: 'ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ',
    timeline: 'ಸಮಯಸಾಲು',
    myGrievances: 'ನನ್ನ ತೊಂದರೆಗಳು',
    noGrievances: 'ಇನ್ನೂ ತೊಂದರೆಗಳಿಲ್ಲ',
    noGrievancesMessage: 'ನೀವು ಸಲ್ಲಿಸಿದ ತೊಂದರೆಗಳು ಇಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತವೆ.',
    submitLink: 'ತೊಂದರೆಯನ್ನು ಸಲ್ಲಿಸಿ',
    submitted: 'ಸಲ್ಲಿಸಲಾಗಿದೆ',
    status: 'ಸ್ಥಿತಿ',
    handledBy: 'ನಿರ್ವಹಿಸಿದವರು',
    resolvedClosed: 'ಬಗೆಹರಿಸಲಾಗಿದೆ / ಮುಚ್ಚಲಾಗಿದೆ',
    resolution: 'ಪರಿಹಾರ',
  },
  ml: {
    title: 'പ്രതിഷേധം സമർപ്പിക്കുക',
    subtitle: 'തെക്കൻ തിത്തങ്കുളം ഗ്രാമപഞ്ചായത്തിൽ പ്രശ്നം അറിയിക്കുക',
    category: 'വിഭാഗം',
    priority: 'ഇത് എത്ര അത്യാവശ്യം?',
    subject: 'വിഷയം',
    subjectPlaceholder: 'ഉദാഹരണത്തിന്: സ്കൂളിന് സമീപം റോഡിന്റെ ലൈറ്റ് പ്രവർത്തിക്കുന്നില്ല',
    description: 'പ്രശ്നം വിശദീകരിക്കുക',
    location: 'സ്ഥാനം / അടയാളം',
    ward: 'വാർഡ്',
    submit: 'പ്രതിഷേധം സമർപ്പിക്കുക',
    successTitle: 'പ്രതിഷേധം സമർപ്പിച്ചു',
    successMessage: 'നില അറിയാൻ നിങ്ങളുടെ റഫറൻസ് നമ്പർ മനസ്സിൽ സൂക്ഷിക്കൂ.',
    trackThis: 'ഈ പരാതിയെക്കുറിച്ച് അറിയുക',
    submitAnother: 'മറ്റൊന്ന് സമർപ്പിക്കുക',
    copyReference: 'റഫറൻസ് നമ്പർ പകർത്തുക',
    trackTitle: 'പ്രതിഷേധം കണ്ടെത്തുക',
    trackSubtitle: 'നിങ്ങളുടെ റഫറൻസ് നമ്പർ നൽകുക, ഉദാഹരണം: STK-GRV-2026-0001',
    track: 'ട്രാക്ക്',
    referenceNumber: 'റഫറൻസ് നമ്പർ',
    timeline: 'കാലരേഖ',
    myGrievances: 'എന്റെ പരാതികൾ',
    noGrievances: 'ഇതുവരെ പരാതികളില്ല',
    noGrievancesMessage: 'നിങ്ങൾ സമർപ്പിക്കുന്ന പരാതികൾ ഇവിടെ ദൃശ്യമാകും.',
    submitLink: 'പ്രതിഷേധം സമർപ്പിക്കുക',
    submitted: 'സമർപ്പിച്ചു',
    status: 'അവസ്ഥ',
    handledBy: 'പരിഹരിച്ചത്',
    resolvedClosed: 'പരിഹരിച്ചു / അടച്ചു',
    resolution: 'പരിഹാരം',
  },
  mr: {
    title: 'तक्रार सादर करा',
    subtitle: 'दक्षिण तित्तंकुलम ग्रामपंचायतमध्ये समस्या नोंदवा',
    category: 'प्रकार',
    priority: 'हे किती तातडीचे आहे?',
    subject: 'विषय',
    subjectPlaceholder: 'उदा. शाळेजवळील रस्त्यावरील दिवा काम करत नाही',
    description: 'समस्येचे वर्णन करा',
    location: 'स्थान / खूण',
    ward: 'वार्ड',
    submit: 'तक्रार सादर करा',
    successTitle: 'तक्रार सादर केली',
    successMessage: 'स्थिती पाहण्यासाठी आपला संदर्भ क्रमांक लक्षात ठेवा.',
    trackThis: 'ही तक्रार ट्रॅक करा',
    submitAnother: 'अधिक सादर करा',
    copyReference: 'संदर्भ क्रमांक कॉपी करा',
    trackTitle: 'तक्रार ट्रॅक करा',
    trackSubtitle: 'आपला संदर्भ क्रमांक प्रविष्ट करा, उदाहरण: STK-GRV-2026-0001',
    track: 'ट्रॅक',
    referenceNumber: 'संदर्भ क्रमांक',
    timeline: 'टाइमलाइन',
    myGrievances: 'माझ्या तक्रारी',
    noGrievances: 'अद्याप तक्रारी नाहीत',
    noGrievancesMessage: 'तुमची सादर केलेली तक्रारी येथे दिसतील.',
    submitLink: 'तक्रार सादर करा',
    submitted: 'सादर केले',
    status: 'स्थिती',
    handledBy: 'सोपवलेले',
    resolvedClosed: 'निकाली / बंद',
    resolution: 'उपाय',
  },
  bn: {
    title: 'অভিযোগ জমা দিন',
    subtitle: 'দক্ষিণ তিত্তাকুলম গ্রামের পঞ্চায়েতের কাছে সমস্যা জানান',
    category: 'বিভাগ',
    priority: 'এটি কতটা জরুরি?',
    subject: 'বিষয়',
    subjectPlaceholder: 'উদাহরণ: স্কুলের পাশে রাস্তার বাতি কাজ করছে না',
    description: 'সমস্যা বর্ণনা করুন',
    location: 'স্থান / landmark',
    ward: 'ওয়ার্ড',
    submit: 'অভিযোগ জমা দিন',
    successTitle: 'অভিযোগ জমা হয়েছে',
    successMessage: 'অবস্থা দেখতে আপনার রেফারেন্স নম্বরটি মনে রাখুন।',
    trackThis: 'এই অভিযোগ ট্র্যাক করুন',
    submitAnother: 'আরেকটি জমা দিন',
    copyReference: 'রেফারেন্স নম্বর কপি করুন',
    trackTitle: 'অভিযোগ ট্র্যাক করুন',
    trackSubtitle: 'আপনার রেফারেন্স নম্বর লিখুন, উদাহরণ: STK-GRV-2026-0001',
    track: 'ট্র্যাক',
    referenceNumber: 'রেফারেন্স নম্বর',
    timeline: 'টাইমলাইন',
    myGrievances: 'আমার অভিযোগ',
    noGrievances: 'এখনো কোনো অভিযোগ নেই',
    noGrievancesMessage: 'আপনি জমা দেওয়া অভিযোগগুলি এখানে দেখা যাবে।',
    submitLink: 'অভিযোগ জমা দিন',
    submitted: 'জমা দেওয়া হয়েছে',
    status: 'অবস্থা',
    handledBy: 'নিয়ন্ত্রণ করা হয়েছে',
    resolvedClosed: 'মীমাংসা / বন্ধ',
    resolution: 'সমাধান',
  },
};

function getGrievanceText(language, key) {
  const lookup = LANGUAGE_TEXT[language] || LANGUAGE_TEXT.en;
  return lookup[key] || LANGUAGE_TEXT.en[key] || key;
}

const CATEGORY_LABELS = {
  'Water Supply': { en: 'Water Supply', hi: 'जल आपूर्ति', ta: 'தண்ணீர் வழங்கல்', te: 'మార్గదర్శక నీరు', kn: 'ನೀರು ಸರಬರಾಜು', ml: 'തണുപ്പിന്റെ ജലം', mr: 'पाणी पुरवठा', bn: 'পানি সরবরাহ' },
  Roads: { en: 'Roads', hi: 'सड़कें', ta: 'சாலைகள்', te: 'మార్గాలు', kn: 'ರಸ್ತೆಗಳು', ml: 'റോഡുകൾ', mr: 'रस्ते', bn: 'রাস্তা' },
  'Street Lights': { en: 'Street Lights', hi: 'स्ट्रीट लाइट', ta: 'தெரு விளக்குகள்', te: 'సిటీ లైట్లు', kn: 'ರಸ್ತೆ ದೀಪಗಳು', ml: 'സ്ട്രീറ്റ് ലൈറ്റുകൾ', mr: 'रस्त्यावरील दिवे', bn: 'রাস্তার বাতি' },
  Drainage: { en: 'Drainage', hi: 'नाली', ta: 'கழிவுநீர்', te: 'నిర్వహణ', kn: 'ನಿರ್ಮಾಣ', ml: 'നദി', mr: 'नाली', bn: 'ফাঁস' },
  Sanitation: { en: 'Sanitation', hi: 'स्वच्छता', ta: 'சுகாதாரம்', te: 'స్వచ్ఛత', kn: 'ಸ್ವಚ್ಛತೆ', ml: 'സുഹൃദം', mr: 'स्वच्छता', bn: 'স্বাস্থ্যবিধি' },
  Health: { en: 'Health', hi: 'स्वास्थ्य', ta: 'சுகாதாரம்', te: 'స్వాస్థ్యం', kn: 'ಆರೋಗ್ಯ', ml: 'ആരോഗ്യം', mr: 'आरोग्य', bn: 'স্বাস্থ্য' },
  Education: { en: 'Education', hi: 'शिक्षा', ta: 'கல்வி', te: 'విద్య', kn: 'ಶಿಕ್ಷಣ', ml: 'വിദ്യ', mr: 'शिक्षण', bn: 'শিক্ষা' },
  Certificates: { en: 'Certificates', hi: 'प्रमाण पत्र', ta: 'சான்றிதழ்கள்', te: 'సర్టిఫికెట్స్', kn: 'ಪ್ರಮಾಣಪತ್ರಗಳು', ml: 'സർട്ടിഫിക്കറ്റുകൾ', mr: 'प्रमाणपत्रे', bn: 'সনদপত্র' },
  'Welfare Schemes': { en: 'Welfare Schemes', hi: 'कल्याण योजनाएँ', ta: 'कल्यாணத் திட்டங்கள்', te: 'సమృద్ధి పథకాలు', kn: 'ಸೌಲಭ್ಯ ಯೋಜನೆಗಳು', ml: 'സൗജന്യ പദ്ധതികൾ', mr: 'कल्याणकारी योजना', bn: 'কল্যাণ প্রকল্প' },
  Other: { en: 'Other', hi: 'अन्य', ta: 'மற்றவை', te: 'ఇతరాలు', kn: 'ಇತರೆ', ml: 'മറ്റുള്ളവ', mr: 'इतर', bn: 'অন্যান্য' },
};

export function SubmitGrievance() {
  const o = useOptions();
  const { language } = useLanguage();
  const [values, setValues] = useState({ priority: 'MEDIUM' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const text = (key) => getGrievanceText(language, key);

  const fields = [
    {
      name: 'category',
      label: text('category'),
      type: 'select',
      required: true,
      options: (o.grievanceCategories || []).map((c) => ({
        value: c,
        label: CATEGORY_LABELS[c]?.[language] || CATEGORY_LABELS[c]?.en || c,
      })),
    },
    {
      name: 'priority',
      label: text('priority'),
      type: 'select',
      options: [
        { value: 'LOW', label: language === 'hi' ? 'कम' : language === 'ta' ? 'குறைவு' : language === 'te' ? 'తక్కువ' : language === 'kn' ? 'ಕಡಿಮೆ' : language === 'ml' ? 'കുറവ്' : language === 'mr' ? 'कमी' : language === 'bn' ? 'কম' : 'Low' },
        { value: 'MEDIUM', label: language === 'hi' ? 'मध्यम' : language === 'ta' ? 'சராசரி' : language === 'te' ? 'మధ్యమ' : language === 'kn' ? 'ಮಧ್ಯಮ' : language === 'ml' ? 'ഇടത്തരം' : language === 'mr' ? 'मध्यम' : language === 'bn' ? 'মাঝারি' : 'Medium' },
        { value: 'HIGH', label: language === 'hi' ? 'उच्च' : language === 'ta' ? 'உயர்' : language === 'te' ? 'అధిక' : language === 'kn' ? 'ಹೆಚ್ಚು' : language === 'ml' ? 'ഉയർന്ന' : language === 'mr' ? 'उच्च' : language === 'bn' ? 'উচ্চ' : 'High' },
        { value: 'CRITICAL', label: language === 'hi' ? 'गंभीर / आपातकाल' : language === 'ta' ? 'மிக அவசரம் / அவசரநிலை' : language === 'te' ? 'అత్యవసర / అత్యవసర' : language === 'kn' ? 'ತುರ್ತು / ಅವಶ್ಯಕ' : language === 'ml' ? 'അത്യാവശ്യം / അടിയന്തിരം' : language === 'mr' ? 'गंभीर / तातडीचे' : language === 'bn' ? 'জরুরি / জরুরি' : 'Critical / emergency' },
      ],
    },
    { name: 'subject', label: text('subject'), required: true, span: 2, placeholder: text('subjectPlaceholder') },
    { name: 'description', label: text('description'), type: 'textarea', required: true, span: 2, rows: 5, minLength: 10 },
    { name: 'location', label: text('location') },
    { name: 'ward', label: text('ward'), type: 'select', options: ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5', 'Ward 6'].map((w) => ({ value: w, label: w })) },
  ];

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(fields, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    setError('');
    try {
      const r = await post('/grievances', serialize(fields, values));
      setDone(r.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="card p-6 text-center sm:p-8">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <h1 className="mt-3 text-xl font-semibold">{text('successTitle')}</h1>
          <p className="mt-1 text-sm text-slate-600">{text('successMessage')}</p>
          <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-md border-2 border-dashed border-gov-300 bg-gov-50 px-4 py-3">
            <span className="font-mono text-lg font-bold text-gov-800">{done.referenceNumber}</span>
            <button className="text-gov-600 hover:text-gov-800" onClick={() => navigator.clipboard?.writeText(done.referenceNumber)} aria-label={text('copyReference')}>
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link to={`/grievances/track?ref=${done.referenceNumber}`} className="btn-primary">{text('trackThis')}</Link>
            <button
              className="btn-secondary"
              onClick={() => {
                setDone(null);
                setValues({ priority: 'MEDIUM' });
              }}
            >
              {text('submitAnother')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={text('title')} subtitle={text('subtitle')} icon={FilePlus2} />
      <Card>
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={submit} noValidate>
          <FormFields fields={fields} values={values} setValues={setValues} errors={errors} />
          <div className="mt-5 flex justify-end">
            <button className="btn-primary" disabled={busy}>
              {busy && <Spinner className="h-4 w-4 text-white" />}
              {text('submit')}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function TrackGrievance() {
  const [params, setParams] = useSearchParams();
  const [ref, setRef] = useState(params.get('ref') || '');
  const [result, setResult] = useState(null);
  const [state, setState] = useState({ loading: false, error: '' });
  const { language } = useLanguage();
  const mine = useFetch('/grievances', { limit: 20 });
  const text = (key) => getGrievanceText(language, key);

  const lookup = async (r) => {
    const q = (r ?? ref).trim();
    if (!q) return;

    setState({ loading: true, error: '' });
    try {
      const res = await get(`/grievances/track/${encodeURIComponent(q)}`);
      setResult(res.data);
      setParams({ ref: q }, { replace: true });
      setState({ loading: false, error: '' });
    } catch (e) {
      setResult(null);
      setState({ loading: false, error: e.message });
    }
  };

  useEffect(() => {
    if (params.get('ref')) lookup(params.get('ref'));
  }, []); // eslint-disable-line

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={text('trackTitle')} subtitle={text('trackSubtitle')} icon={Search} />
      <form
        className="card flex flex-col gap-2 p-4 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          lookup();
        }}
      >
        <label className="sr-only" htmlFor="ref">
          {text('referenceNumber')}
        </label>
        <input
          id="ref"
          className="input font-mono uppercase"
          placeholder="STK-GRV-2026-0001"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
        />
        <button className="btn-primary" disabled={state.loading}>
          {state.loading ? <Spinner className="h-4 w-4 text-white" /> : <Search className="h-4 w-4" />}
          {text('track')}
        </button>
      </form>

      {state.error && (
        <div className="mt-4">
          <ErrorState message={state.error} />
        </div>
      )}

      {result && (
        <Card className="mt-4" title={<span className="font-mono">{result.referenceNumber}</span>} actions={<StatusBadge value={result.status} />}>
          <div className="space-y-5">
            {result.history ? <GrievanceStepper g={result} /> : null}
            <div>
              <p className="text-xs text-slate-500">{result.category}</p>
              <h3 className="text-lg font-semibold">{result.subject}</h3>
              {result.description && <p className="mt-1 text-sm text-slate-700">{result.description}</p>}
            </div>
            <DetailGrid
              items={[
                [text('submitted'), formatDate(result.createdAt, true)],
                [text('status'), <StatusBadge key="s" value={result.status} />],
                result.assignedTo && [text('handledBy'), result.assignedTo.designation || result.assignedTo.name],
                [text('resolvedClosed'), formatDate(result.resolvedAt, true)],
                result.resolution && [text('resolution'), result.resolution],
              ]}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900">
              <div>
                <span className="font-semibold">Need Assistance or Official Follow-up?</span>
                <p className="text-emerald-700 text-[11px]">Chat directly with Panchayat Helpdesk on WhatsApp Web</p>
              </div>
              <WhatsAppButton
                phone="916381746557"
                message={`Hello Panchayat Helpdesk, inquiring regarding Grievance Ref: ${result.referenceNumber} (${result.subject}). Status is currently ${result.status}.`}
                label="Contact Helpdesk via WhatsApp Web"
                size="sm"
              />
            </div>

            {result.history && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">{text('timeline')}</h4>
                <GrievanceTimeline history={result.history} />
              </div>
            )}
          </div>
        </Card>
      )}

      <Card className="mt-6" title={text('myGrievances')} bodyClass="p-0">
        <AsyncBoundary
          loading={mine.loading}
          error={mine.error}
          onRetry={mine.reload}
          empty={!mine.data?.length}
          emptyProps={{
            title: text('noGrievances'),
            message: text('noGrievancesMessage'),
            action: (
              <Link to="/grievances/new" className="btn-primary">
                {text('submitLink')}
              </Link>
            ),
          }}
        >
          <ul className="divide-y divide-slate-100">
            {(mine.data || []).map((g) => (
              <li key={g._id}>
                <button
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 sm:px-5"
                  onClick={() => {
                    setRef(g.referenceNumber);
                    lookup(g.referenceNumber);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{g.subject}</p>
                    <p className="font-mono text-xs text-slate-500">{g.referenceNumber} · {formatDate(g.createdAt)}</p>
                  </div>
                  <StatusBadge value={g.status} />
                </button>
              </li>
            ))}
          </ul>
        </AsyncBoundary>
      </Card>
    </div>
  );
}
