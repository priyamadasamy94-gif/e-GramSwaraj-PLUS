import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Landmark, Pencil, Phone, Mail, Clock, MapPin, Users, Home, Layers, Ruler } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { AsyncBoundary } from '../components/ui/Feedback';
import { Card, DemoNotice, DetailGrid, PageHeader, StatCard } from '../components/ui/Misc';
import { formatNumber } from '../utils/format';
import { isAdmin, isCitizen } from '../utils/roles';
import { useLanguage } from '../context/LanguageContext';

const PROFILE_TEXT = {
  en: { title: 'Village Profile', edit: 'Edit village information', block: 'Block', taluk: 'Taluk', district: 'District', location: 'Map & Location', admin: 'Panchayat Administration', contact: 'Contact Information', demographics: 'Demographic Details (As on Date)', amenities: 'Basic Amenities & Digital Infrastructure', development: 'Development Overview', facilities: 'Important Public Facilities', audit: 'Scheme Audit (15th Finance Commission – 15FC)', population: 'Population', households: 'Households', wards: 'Wards', area: 'Total Area', taps: 'Tap Water Conn.', toilets: 'Household Toilets', panchayat: 'Panchayat', lgdCode: 'LGD Code', revenueVillages: 'Revenue Villages', secretary: 'Secretary', secretaryMobile: 'Secretary Mobile', joiningDate: 'Joining Date', busStop: 'Nearest Bus Stop', attractions: 'GP Attractions', malePopulation: 'Male Population', femalePopulation: 'Female Population', scPopulation: 'SC Population', generalPopulation: 'General Population', children06: 'Children (0–6 yrs)', children618: 'Children (6–18 yrs)', jobCards: 'Job Card Holders', shgOldAge: 'No. of SHGs / Old Age', panchayatBuilding: 'Panchayat Bhawan', csc: 'CSC (Common Service Centre)', computer: 'Computer / Scanner / Printer', library: 'Panchayat Library', rainwater: 'Rooftop Rainwater Harvesting', alternateWater: 'Alternate Water Source', internet: 'Internet & Power Connection', available: 'Available (Yes)', coLocated: 'Co-located in Bhawan', equipment: '1 Computer, 1 Scanner, 1 Printer', yes: 'Yes', installed: 'Installed (Yes)', borewell: 'Borewell', utilities: 'Electric Supply / Private ISP', viewActivities: 'View {count} activities →', totalActivities: 'Total Activities', completed: 'Completed', inProgress: 'In Progress', approvedPlanned: 'Approved / Planned', noFacilities: 'No facilities recorded.', auditTeam: 'Audit Team: Thoothukudi Kovilpatti Thittankulam', scheme: 'Scheme', auditPeriod: 'Audit Period', teamMembers: 'Audit Team Members:', observation: 'Observation (1 Count): 10 - Non remittance of deductions recoveries', noLocation: 'No location configured.', approximate: 'Approximate location', mapNote: 'Prototype map: marker shows an approximate village location on OpenStreetMap. The dashed circle is indicative only — it is not a village, ward, cadastral or survey-number boundary. Official GIS layers (village & ward boundaries, assets, works, roads, water resources) can be loaded in a later phase.', description: 'Thittankulam (South Thittankulam) is a vibrant Village Panchayat in Kovilpatti Taluk, Thoothukkudi District, Tamil Nadu (LGD Code: 231907). This official platform provides digital tracking for GPDP developmental plans, 15th Finance Commission works, liquid & solid waste management, piped water supply under JJM, public assets, Gram Sabha governance, and citizen grievance redressal.', dataNote: 'Official data sourced from eGramSwaraj portal for Thittankulam Village Panchayat (LGD: 231907).', education: 'Education', childCare: 'Child Care', health: 'Health', eGovernance: 'e-Governance', sanitation: 'Sanitation', publicDistribution: 'Public Distribution', water: 'Water', community: 'Community', waterBody: 'Water Body', schoolPrimary: 'Panchayat Union Primary School', schoolMiddle: 'Panchayat Union Middle / Secondary School', anganwadi: 'Anganwadi / Pre-Primary Centre', primaryHealth: 'Primary Health Centre', healthSubCentre: 'Health Sub-Centre', cscFacility: 'Common Service Centre (CSC)', sanitaryComplex: 'Community Sanitary Complex', rationShop: 'Ration Shop (Fair Price Shop)', overheadTank: 'Overhead Water Tank (OHT)', communityHall: 'Community Hall', templeTank: 'Temple Tank / Oorani', office: 'Panchayat Office', hours: 'Mon–Fri, 10:00 AM – 5:45 PM', auditTeamLead: 'Audit Team: Thoothukudi Kovilpatti Thittankulam', auditObservation: 'Observation (1 Count): 10 - Non remittance of deductions recoveries', dyBdo: 'Dy. Block Development Officer', assistantDirectorAudit: 'Assistant Director Audit (RD)', localFundAudit: 'Assistant Director (Local Fund Audit)' },
  hi: { title: 'ग्राम प्रोफ़ाइल', edit: 'ग्राम की जानकारी संपादित करें', block: 'ब्लॉक', taluk: 'तालुक', district: 'ज़िला', location: 'मानचित्र और स्थान', admin: 'पंचायत प्रशासन', contact: 'संपर्क जानकारी', demographics: 'जनसांख्यिकीय विवरण (आज तक)', amenities: 'मूलभूत सुविधाएँ और डिजिटल अवसंरचना', development: 'विकास का अवलोकन', facilities: 'महत्वपूर्ण सार्वजनिक सुविधाएँ', audit: 'योजना लेखापरीक्षा (15वाँ वित्त आयोग – 15FC)', population: 'जनसंख्या', households: 'परिवार', wards: 'वार्ड', area: 'कुल क्षेत्रफल', taps: 'नल जल कनेक्शन', toilets: 'घरेलू शौचालय', panchayat: 'पंचायत', lgdCode: 'एलजीडी कोड', revenueVillages: 'राजस्व गाँव', secretary: 'सचिव', secretaryMobile: 'सचिव का मोबाइल', joiningDate: 'कार्यग्रहण तिथि', busStop: 'निकटतम बस स्टॉप', attractions: 'ग्राम पंचायत के दर्शनीय स्थल', malePopulation: 'पुरुष जनसंख्या', femalePopulation: 'महिला जनसंख्या', scPopulation: 'अनुसूचित जाति जनसंख्या', generalPopulation: 'सामान्य जनसंख्या', children06: 'बच्चे (0–6 वर्ष)', children618: 'बच्चे (6–18 वर्ष)', jobCards: 'जॉब कार्ड धारक', shgOldAge: 'स्वयं सहायता समूह / वृद्धाश्रम संख्या', panchayatBuilding: 'पंचायत भवन', csc: 'सीएससी (सामान्य सेवा केंद्र)', computer: 'कंप्यूटर / स्कैनर / प्रिंटर', library: 'पंचायत पुस्तकालय', rainwater: 'छत पर वर्षा जल संचयन', alternateWater: 'वैकल्पिक जल स्रोत', internet: 'इंटरनेट और बिजली कनेक्शन', available: 'उपलब्ध (हाँ)', coLocated: 'भवन में सह-स्थित', equipment: '1 कंप्यूटर, 1 स्कैनर, 1 प्रिंटर', yes: 'हाँ', installed: 'स्थापित (हाँ)', borewell: 'बोरवेल', utilities: 'बिजली आपूर्ति / निजी इंटरनेट सेवा', viewActivities: '{count} गतिविधियाँ देखें →', totalActivities: 'कुल गतिविधियाँ', completed: 'पूर्ण', inProgress: 'प्रगति पर', approvedPlanned: 'स्वीकृत / नियोजित', noFacilities: 'कोई सुविधा दर्ज नहीं है।', auditTeam: 'लेखापरीक्षा दल: थूथुकुडी कोविलपट्टी थिट्टनकुलम', scheme: 'योजना', auditPeriod: 'लेखापरीक्षा अवधि', teamMembers: 'लेखापरीक्षा दल के सदस्य:', observation: 'टिप्पणी (1): 10 - कटौतियों की वसूली जमा नहीं की गई', noLocation: 'स्थान निर्धारित नहीं है।', approximate: 'अनुमानित स्थान', mapNote: 'प्रोटोटाइप मानचित्र: चिह्न OpenStreetMap पर गाँव का अनुमानित स्थान दिखाता है। बिंदीदार वृत्त केवल संकेतात्मक है, यह गाँव, वार्ड या भू-सर्वेक्षण सीमा नहीं है। आधिकारिक GIS परतें बाद के चरण में जोड़ी जा सकती हैं।', description: 'थिट्टनकुलम (दक्षिण थिट्टनकुलम) तमिलनाडु के थूथुक्कुडी ज़िले के कोविलपट्टी तालुक में स्थित एक सक्रिय ग्राम पंचायत है (एलजीडी कोड: 231907)। यह आधिकारिक मंच जीपीडीपी विकास योजनाओं, 15वें वित्त आयोग के कार्यों, ठोस और तरल कचरा प्रबंधन, जल जीवन मिशन के तहत पाइप जलापूर्ति, सार्वजनिक संपत्तियों, ग्राम सभा प्रशासन और नागरिक शिकायत निवारण की डिजिटल निगरानी प्रदान करता है।', dataNote: 'आधिकारिक डेटा eGramSwaraj पोर्टल से थिट्टनकुलम ग्राम पंचायत (एलजीडी: 231907) के लिए लिया गया है।', education: 'शिक्षा', childCare: 'बाल देखभाल', health: 'स्वास्थ्य', eGovernance: 'ई-शासन', sanitation: 'स्वच्छता', publicDistribution: 'सार्वजनिक वितरण', water: 'जल', community: 'सामुदायिक', waterBody: 'जल निकाय', schoolPrimary: 'पंचायत संघ प्राथमिक विद्यालय', schoolMiddle: 'पंचायत संघ मध्य / माध्यमिक विद्यालय', anganwadi: 'आंगनवाड़ी / पूर्व-प्राथमिक केंद्र', primaryHealth: 'प्राथमिक स्वास्थ्य केंद्र', healthSubCentre: 'स्वास्थ्य उप-केंद्र', cscFacility: 'सामान्य सेवा केंद्र (सीएससी)', sanitaryComplex: 'सामुदायिक स्वच्छता परिसर', rationShop: 'राशन की दुकान (उचित मूल्य दुकान)', overheadTank: 'ऊँची जल टंकी (ओएचटी)', communityHall: 'सामुदायिक भवन', templeTank: 'मंदिर तालाब / ऊरानी', office: 'पंचायत कार्यालय', hours: 'सोम–शुक्र, सुबह 10:00 – शाम 5:45', auditTeamLead: 'लेखापरीक्षा दल: थूथुकुडी कोविलपट्टी थिट्टनकुलम', auditObservation: 'टिप्पणी (1): 10 - कटौतियों की वसूली जमा नहीं की गई', dyBdo: 'उप खंड विकास अधिकारी', assistantDirectorAudit: 'सहायक लेखापरीक्षा निदेशक (ग्रामीण विकास)', localFundAudit: 'सहायक निदेशक (स्थानीय निधि लेखापरीक्षा)' },
  ta: { title: 'கிராம விவரம்', edit: 'கிராமத் தகவலைத் திருத்து', block: 'வட்டாரம்', taluk: 'வட்டம்', district: 'மாவட்டம்', location: 'வரைபடம் மற்றும் இடம்', admin: 'ஊராட்சி நிர்வாகம்', contact: 'தொடர்பு தகவல்', demographics: 'மக்கள்தொகை விவரங்கள் (இன்றைய நிலவரப்படி)', amenities: 'அடிப்படை வசதிகள் மற்றும் டிஜிட்டல் உள்கட்டமைப்பு', development: 'வளர்ச்சி மேலோட்டம்', facilities: 'முக்கிய பொதுவசதிகள்', audit: 'திட்டத் தணிக்கை (15வது நிதிக்குழு – 15FC)', population: 'மக்கள்தொகை', households: 'குடும்பங்கள்', wards: 'வார்டுகள்', area: 'மொத்தப் பரப்பளவு', taps: 'குடிநீர் குழாய் இணைப்புகள்', toilets: 'வீட்டுக் கழிப்பறைகள்', panchayat: 'ஊராட்சி', lgdCode: 'LGD குறியீடு', revenueVillages: 'வருவாய் கிராமங்கள்', secretary: 'செயலாளர்', secretaryMobile: 'செயலாளர் கைபேசி', joiningDate: 'பணியில் சேர்ந்த நாள்', busStop: 'அருகிலுள்ள பேருந்து நிறுத்தம்', attractions: 'ஊராட்சி சிறப்பிடங்கள்', malePopulation: 'ஆண்கள் மக்கள்தொகை', femalePopulation: 'பெண்கள் மக்கள்தொகை', scPopulation: 'பட்டியல் சாதி மக்கள்தொகை', generalPopulation: 'பொது மக்கள்தொகை', children06: 'குழந்தைகள் (0–6 வயது)', children618: 'குழந்தைகள் (6–18 வயது)', jobCards: 'வேலை அட்டைதாரர்கள்', shgOldAge: 'சுயஉதவிக் குழுக்கள் / முதியோர் இல்லங்கள்', panchayatBuilding: 'ஊராட்சி மன்றக் கட்டிடம்', csc: 'CSC (பொது சேவை மையம்)', computer: 'கணினி / வருடி / அச்சுப்பொறி', library: 'ஊராட்சி நூலகம்', rainwater: 'மொட்டைமாடி மழைநீர் சேகரிப்பு', alternateWater: 'மாற்று நீராதாரம்', internet: 'இணையம் மற்றும் மின் இணைப்பு', available: 'உள்ளது (ஆம்)', coLocated: 'கட்டிடத்தில் இணைந்து உள்ளது', equipment: '1 கணினி, 1 வருடி, 1 அச்சுப்பொறி', yes: 'ஆம்', installed: 'நிறுவப்பட்டுள்ளது (ஆம்)', borewell: 'ஆழ்துளைக் கிணறு', utilities: 'மின்சாரம் / தனியார் இணைய சேவை', viewActivities: '{count} பணிகளைக் காண்க →', totalActivities: 'மொத்தப் பணிகள்', completed: 'முடிந்தது', inProgress: 'நடைபெறுகிறது', approvedPlanned: 'ஒப்புதல் / திட்டமிடப்பட்டது', noFacilities: 'வசதிகள் எதுவும் பதிவு செய்யப்படவில்லை.', auditTeam: 'தணிக்கைக் குழு: தூத்துக்குடி கோவில்பட்டி திட்டங்குளம்', scheme: 'திட்டம்', auditPeriod: 'தணிக்கை காலம்', teamMembers: 'தணிக்கைக் குழு உறுப்பினர்கள்:', observation: 'கண்காணிப்பு (1): 10 - பிடித்தம் செய்யப்பட்ட தொகைகள் செலுத்தப்படவில்லை', noLocation: 'இடம் அமைக்கப்படவில்லை.', approximate: 'தோராயமான இடம்', mapNote: 'முன்மாதிரி வரைபடம்: OpenStreetMap-இல் கிராமத்தின் தோராயமான இடத்தை குறியீடு காட்டுகிறது. கோடிட்ட வட்டம் சுட்டிக்காட்டுவதற்காக மட்டுமே; இது கிராமம், வார்டு அல்லது நில அளவை எல்லை அல்ல. அதிகாரப்பூர்வ GIS வரைபடங்கள் பின்னர் சேர்க்கப்படலாம்.', description: 'திட்டங்குளம் (தெற்கு திட்டங்குளம்), தமிழ்நாட்டின் தூத்துக்குடி மாவட்டம் கோவில்பட்டி வட்டத்தில் அமைந்துள்ள சிறப்பான கிராம ஊராட்சியாகும் (LGD குறியீடு: 231907). GPDP வளர்ச்சித் திட்டங்கள், 15வது நிதிக்குழுப் பணிகள், திட மற்றும் திரவக் கழிவு மேலாண்மை, ஜல் ஜீவன் திட்டக் குழாய் குடிநீர், பொதுச் சொத்துகள், கிராம சபை நிர்வாகம் மற்றும் மக்கள் குறைதீர்ப்பு ஆகியவற்றை இந்த அதிகாரப்பூர்வ தளம் டிஜிட்டல் முறையில் கண்காணிக்கிறது.', dataNote: 'திட்டங்குளம் கிராம ஊராட்சிக்கான அதிகாரப்பூர்வ தரவு eGramSwaraj தளத்திலிருந்து பெறப்பட்டது (LGD: 231907).', education: 'கல்வி', childCare: 'குழந்தை பராமரிப்பு', health: 'சுகாதாரம்', eGovernance: 'மின் ஆளுமை', sanitation: 'துப்புரவு', publicDistribution: 'பொது விநியோகம்', water: 'நீர்', community: 'சமூகம்', waterBody: 'நீர்நிலை', schoolPrimary: 'ஊராட்சி ஒன்றிய தொடக்கப்பள்ளி', schoolMiddle: 'ஊராட்சி ஒன்றிய நடுநிலை / உயர்நிலைப் பள்ளி', anganwadi: 'அங்கன்வாடி / முன்பருவக் கல்வி மையம்', primaryHealth: 'ஆரம்ப சுகாதார நிலையம்', healthSubCentre: 'சுகாதார துணை நிலையம்', cscFacility: 'பொது சேவை மையம் (CSC)', sanitaryComplex: 'சமுதாய சுகாதார வளாகம்', rationShop: 'நியாய விலைக் கடை', overheadTank: 'மேல்நிலை நீர்த்தேக்கத் தொட்டி (OHT)', communityHall: 'சமூகக் கூடம்', templeTank: 'கோவில் குளம் / ஊரணி', office: 'ஊராட்சி அலுவலகம்', hours: 'திங்கள்–வெள்ளி, காலை 10:00 – மாலை 5:45', auditTeamLead: 'தணிக்கைக் குழு: தூத்துக்குடி கோவில்பட்டி திட்டங்குளம்', auditObservation: 'கண்காணிப்பு (1): 10 - பிடித்தம் செய்யப்பட்ட தொகைகள் செலுத்தப்படவில்லை', dyBdo: 'துணை வட்டார வளர்ச்சி அலுவலர்', assistantDirectorAudit: 'தணிக்கை உதவி இயக்குநர் (ஊரக வளர்ச்சி)', localFundAudit: 'உள்ளாட்சி நிதித் தணிக்கை உதவி இயக்குநர்' },
  te: { title: 'గ్రామ ప్రొఫైల్', edit: 'గ్రామ సమాచారాన్ని సవరించండి', block: 'బ్లాక్', taluk: 'తాలూకా', district: 'జిల్లా', location: 'మ్యాప్ మరియు స్థానం', admin: 'పంచాయతీ పరిపాలన', contact: 'సంప్రదింపు సమాచారం', demographics: 'జనాభా వివరాలు (నేటి నాటికి)', amenities: 'ప్రాథమిక సదుపాయాలు మరియు డిజిటల్ మౌలిక సదుపాయాలు', development: 'అభివృద్ధి అవలోకనం', facilities: 'ముఖ్యమైన ప్రజా సదుపాయాలు', audit: 'పథకం ఆడిట్ (15వ ఆర్థిక సంఘం – 15FC)', population: 'జనాభా', households: 'గృహాలు', wards: 'వార్డులు', area: 'మొత్తం విస్తీర్ణం', taps: 'కుళాయి నీటి కనెక్షన్లు', toilets: 'గృహ మరుగుదొడ్లు', panchayat: 'పంచాయతీ', lgdCode: 'LGD కోడ్', revenueVillages: 'రెవెన్యూ గ్రామాలు', secretary: 'కార్యదర్శి', secretaryMobile: 'కార్యదర్శి మొబైల్', joiningDate: 'చేరిన తేదీ', busStop: 'సమీప బస్ స్టాప్', attractions: 'గ్రామ ఆకర్షణలు', malePopulation: 'పురుషుల జనాభా', femalePopulation: 'మహిళల జనాభా', scPopulation: 'SC జనాభా', generalPopulation: 'సాధారణ జనాభా', children06: 'పిల్లలు (0–6 సంవత్సరాలు)', children618: 'పిల్లలు (6–18 సంవత్సరాలు)', jobCards: 'జాబ్ కార్డు హోల్డర్లు', shgOldAge: 'SHGలు / వృద్ధాశ్రమాల సంఖ్య', panchayatBuilding: 'పంచాయతీ భవనం', csc: 'CSC (సామాన్య సేవా కేంద్రం)', computer: 'కంప్యూటర్ / స్కానర్ / ప్రింటర్', library: 'పంచాయతీ గ్రంథాలయం', rainwater: 'పైకప్పు వర్షపు నీటి సంరక్షణ', alternateWater: 'ప్రత్యామ్నాయ నీటి వనరు', internet: 'ఇంటర్నెట్ మరియు విద్యుత్ కనెక్షన్', available: 'అందుబాటులో ఉంది (అవును)', coLocated: 'భవనంలోనే ఉంది', equipment: '1 కంప్యూటర్, 1 స్కానర్, 1 ప్రింటర్', yes: 'అవును', installed: 'స్థాపించబడింది (అవును)', borewell: 'బోర్‌వెల్', utilities: 'విద్యుత్ సరఫరా / ప్రైవేట్ ISP', viewActivities: '{count} పనులను చూడండి →', totalActivities: 'మొత్తం పనులు', completed: 'పూర్తయింది', inProgress: 'పురోగతిలో ఉంది', approvedPlanned: 'ఆమోదించబడింది / ప్రణాళికలో ఉంది', noFacilities: 'సదుపాయాలు నమోదు కాలేదు.', auditTeam: 'ఆడిట్ బృందం: తూత్తుకుడి కోవిల్పట్టి తిట్టంకుళం', scheme: 'పథకం', auditPeriod: 'ఆడిట్ కాలం', teamMembers: 'ఆడిట్ బృంద సభ్యులు:', observation: 'గమనిక (1): 10 - మినహాయింపు రికవరీలు జమ కాలేదు', noLocation: 'స్థానం కాన్ఫిగర్ చేయబడలేదు.', approximate: 'సుమారు స్థానం', mapNote: 'ప్రోటోటైప్ మ్యాప్: OpenStreetMapలో గ్రామం యొక్క సుమారు స్థానాన్ని గుర్తు చూపిస్తుంది. చుక్కల వృత్తం సూచన మాత్రమే; ఇది గ్రామం, వార్డు లేదా భూ సర్వే సరిహద్దు కాదు. అధికారిక GIS లేయర్లు తరువాత జోడించవచ్చు.', description: 'తిట్టంకుళం (దక్షిణ తిట్టంకుళం) తమిళనాడులోని తూత్తుకుడి జిల్లా కోవిల్పట్టి తాలూకాలో ఉన్న గ్రామ పంచాయతీ (LGD కోడ్: 231907). ఈ అధికారిక వేదిక GPDP అభివృద్ధి ప్రణాళికలు, 15వ ఆర్థిక సంఘం పనులు, ఘన మరియు ద్రవ వ్యర్థాల నిర్వహణ, JJM కింద పైపుల ద్వారా నీటి సరఫరా, ప్రజా ఆస్తులు, గ్రామ సభ పాలన మరియు పౌరుల ఫిర్యాదులను డిజిటల్‌గా ట్రాక్ చేస్తుంది.', dataNote: 'తిట్టంకుళం గ్రామ పంచాయతీకి సంబంధించిన అధికారిక డేటా eGramSwaraj పోర్టల్ నుండి పొందబడింది (LGD: 231907).', education: 'విద్య', childCare: 'శిశు సంరక్షణ', health: 'ఆరోగ్యం', eGovernance: 'ఈ-పాలన', sanitation: 'పారిశుధ్యం', publicDistribution: 'ప్రజా పంపిణీ', water: 'నీరు', community: 'సమాజం', waterBody: 'జల వనరు', schoolPrimary: 'పంచాయతీ యూనియన్ ప్రాథమిక పాఠశాల', schoolMiddle: 'పంచాయతీ యూనియన్ ప్రాథమికోన్నత / మాధ్యమిక పాఠశాల', anganwadi: 'అంగన్‌వాడీ / ప్రీ-ప్రైమరీ కేంద్రం', primaryHealth: 'ప్రాథమిక ఆరోగ్య కేంద్రం', healthSubCentre: 'ఆరోగ్య ఉపకేంద్రం', cscFacility: 'సామాన్య సేవా కేంద్రం (CSC)', sanitaryComplex: 'సామూహిక పారిశుధ్య సముదాయం', rationShop: 'రేషన్ దుకాణం (న్యాయ ధరల దుకాణం)', overheadTank: 'ఓవర్‌హెడ్ వాటర్ ట్యాంక్ (OHT)', communityHall: 'కమ్యూనిటీ హాల్', templeTank: 'ఆలయ చెరువు / ఊరணி', office: 'పంచాయతీ కార్యాలయం', hours: 'సోమ–శుక్ర, ఉదయం 10:00 – సాయంత్రం 5:45', auditTeamLead: 'ఆడిట్ బృందం: తూత్తుకుడి కోవిల్పట్టి తిట్టంకుళం', auditObservation: 'గమనిక (1): 10 - మినహాయింపు రికవరీలు జమ కాలేదు', dyBdo: 'డిప్యూటీ బ్లాక్ డెవలప్‌మెంట్ అధికారి', assistantDirectorAudit: 'సహాయ ఆడిట్ డైరెక్టర్ (గ్రామీణాభివృద్ధి)', localFundAudit: 'సహాయ డైరెక్టర్ (స్థానిక నిధుల ఆడిట్)' },
  kn: { title: 'ಗ್ರಾಮ ಪ್ರೊಫೈಲ್', edit: 'ಗ್ರಾಮದ ಮಾಹಿತಿಯನ್ನು ಸಂಪಾದಿಸಿ', block: 'ಬ್ಲಾಕ್', taluk: 'ತಾಲ್ಲೂಕು', district: 'ಜಿಲ್ಲೆ', location: 'ನಕ್ಷೆ ಮತ್ತು ಸ್ಥಳ', admin: 'ಪಂಚಾಯತ್ ಆಡಳಿತ', contact: 'ಸಂಪರ್ಕ ಮಾಹಿತಿ', demographics: 'ಜನಸಂಖ್ಯಾ ವಿವರಗಳು (ಇಂದಿನಂತೆ)', amenities: 'ಮೂಲಭೂತ ಸೌಲಭ್ಯಗಳು ಮತ್ತು ಡಿಜಿಟಲ್ ಮೂಲಸೌಕರ್ಯ', development: 'ಅಭಿವೃದ್ಧಿ ಅವಲೋಕನ', facilities: 'ಪ್ರಮುಖ ಸಾರ್ವಜನಿಕ ಸೌಲಭ್ಯಗಳು', audit: 'ಯೋಜನೆ ಲೆಕ್ಕಪರಿಶೋಧನೆ (15ನೇ ಹಣಕಾಸು ಆಯೋಗ – 15FC)', population: 'ಜನಸಂಖ್ಯೆ', households: 'ಕುಟುಂಬಗಳು', wards: 'ವಾರ್ಡ್‌ಗಳು', area: 'ಒಟ್ಟು ವಿಸ್ತೀರ್ಣ', taps: 'ನಲ್ಲಿ ನೀರಿನ ಸಂಪರ್ಕಗಳು', toilets: 'ಮನೆಯ ಶೌಚಾಲಯಗಳು', panchayat: 'ಪಂಚಾಯತ್', lgdCode: 'LGD ಕೋಡ್', revenueVillages: 'ಕಂದಾಯ ಗ್ರಾಮಗಳು', secretary: 'ಕಾರ್ಯದರ್ಶಿ', secretaryMobile: 'ಕಾರ್ಯದರ್ಶಿಯ ಮೊಬೈಲ್', joiningDate: 'ಸೇರ್ಪಡೆ ದಿನಾಂಕ', busStop: 'ಹತ್ತಿರದ ಬಸ್ ನಿಲ್ದಾಣ', attractions: 'ಗ್ರಾಮದ ಆಕರ್ಷಣೆಗಳು', malePopulation: 'ಪುರುಷರ ಜನಸಂಖ್ಯೆ', femalePopulation: 'ಮಹಿಳೆಯರ ಜನಸಂಖ್ಯೆ', scPopulation: 'ಪರಿಶಿಷ್ಟ ಜಾತಿ ಜನಸಂಖ್ಯೆ', generalPopulation: 'ಸಾಮಾನ್ಯ ಜನಸಂಖ್ಯೆ', children06: 'ಮಕ್ಕಳು (0–6 ವರ್ಷ)', children618: 'ಮಕ್ಕಳು (6–18 ವರ್ಷ)', jobCards: 'ಜಾಬ್ ಕಾರ್ಡ್ ಹೊಂದಿರುವವರು', shgOldAge: 'ಸ್ವಸಹಾಯ ಗುಂಪುಗಳು / ವೃದ್ಧಾಶ್ರಮಗಳ ಸಂಖ್ಯೆ', panchayatBuilding: 'ಪಂಚಾಯತ್ ಭವನ', csc: 'CSC (ಸಾಮಾನ್ಯ ಸೇವಾ ಕೇಂದ್ರ)', computer: 'ಕಂಪ್ಯೂಟರ್ / ಸ್ಕ್ಯಾನರ್ / ಪ್ರಿಂಟರ್', library: 'ಪಂಚಾಯತ್ ಗ್ರಂಥಾಲಯ', rainwater: 'ಮೇಲ್ಛಾವಣಿ ಮಳೆನೀರು ಕೊಯ್ಲು', alternateWater: 'ಪರ್ಯಾಯ ನೀರಿನ ಮೂಲ', internet: 'ಇಂಟರ್ನೆಟ್ ಮತ್ತು ವಿದ್ಯುತ್ ಸಂಪರ್ಕ', available: 'ಲಭ್ಯವಿದೆ (ಹೌದು)', coLocated: 'ಭವನದಲ್ಲೇ ಇದೆ', equipment: '1 ಕಂಪ್ಯೂಟರ್, 1 ಸ್ಕ್ಯಾನರ್, 1 ಪ್ರಿಂಟರ್', yes: 'ಹೌದು', installed: 'ಅಳವಡಿಸಲಾಗಿದೆ (ಹೌದು)', borewell: 'ಬೋರ್‌ವೆಲ್', utilities: 'ವಿದ್ಯುತ್ ಪೂರೈಕೆ / ಖಾಸಗಿ ISP', viewActivities: '{count} ಚಟುವಟಿಕೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ →', totalActivities: 'ಒಟ್ಟು ಚಟುವಟಿಕೆಗಳು', completed: 'ಪೂರ್ಣಗೊಂಡಿದೆ', inProgress: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ', approvedPlanned: 'ಅನುಮೋದಿತ / ಯೋಜಿತ', noFacilities: 'ಯಾವುದೇ ಸೌಲಭ್ಯಗಳು ದಾಖಲಾಗಿಲ್ಲ.', auditTeam: 'ಲೆಕ್ಕಪರಿಶೋಧನಾ ತಂಡ: ತೂತುಕುಡಿ ಕೋವಿಲ್ಪಟ್ಟಿ ತಿಟ್ಟಂಕುಲಂ', scheme: 'ಯೋಜನೆ', auditPeriod: 'ಲೆಕ್ಕಪರಿಶೋಧನಾ ಅವಧಿ', teamMembers: 'ಲೆಕ್ಕಪರಿಶೋಧನಾ ತಂಡದ ಸದಸ್ಯರು:', observation: 'ಗಮನಿಕೆ (1): 10 - ಕಡಿತ ವಸೂಲಾತಿ ಮೊತ್ತ ಜಮೆಯಾಗಿಲ್ಲ', noLocation: 'ಸ್ಥಳವನ್ನು ಹೊಂದಿಸಲಾಗಿಲ್ಲ.', approximate: 'ಅಂದಾಜು ಸ್ಥಳ', mapNote: 'ಮಾದರಿ ನಕ್ಷೆ: OpenStreetMapನಲ್ಲಿ ಗ್ರಾಮದ ಅಂದಾಜು ಸ್ಥಳವನ್ನು ಗುರುತು ತೋರಿಸುತ್ತದೆ. ಚುಕ್ಕೆಗಳ ವೃತ್ತವು ಸೂಚಕ ಮಾತ್ರ; ಇದು ಗ್ರಾಮ, ವಾರ್ಡ್ ಅಥವಾ ಭೂಮಾಪನ ಗಡಿಯಲ್ಲ. ಅಧಿಕೃತ GIS ಪದರಗಳನ್ನು ನಂತರ ಸೇರಿಸಬಹುದು.', description: 'ತಿಟ್ಟಂಕುಲಂ (ದಕ್ಷಿಣ ತಿಟ್ಟಂಕುಲಂ) ತಮಿಳುನಾಡಿನ ತೂತುಕುಡಿ ಜಿಲ್ಲೆಯ ಕೋವಿಲ್ಪಟ್ಟಿ ತಾಲ್ಲೂಕಿನಲ್ಲಿರುವ ಗ್ರಾಮ ಪಂಚಾಯತ್ (LGD ಕೋಡ್: 231907). ಈ ಅಧಿಕೃತ ವೇದಿಕೆ GPDP ಅಭಿವೃದ್ಧಿ ಯೋಜನೆಗಳು, 15ನೇ ಹಣಕಾಸು ಆಯೋಗದ ಕಾಮಗಾರಿಗಳು, ಘನ ಮತ್ತು ದ್ರವ ತ್ಯಾಜ್ಯ ನಿರ್ವಹಣೆ, JJM ಅಡಿಯಲ್ಲಿ ಕೊಳವೆ ನೀರು, ಸಾರ್ವಜನಿಕ ಆಸ್ತಿಗಳು, ಗ್ರಾಮ ಸಭೆ ಆಡಳಿತ ಮತ್ತು ನಾಗರಿಕರ ಕುಂದುಕೊರತೆ ಪರಿಹಾರವನ್ನು ಡಿಜಿಟಲ್‌ನಲ್ಲಿ ಅನುಸರಿಸುತ್ತದೆ.', dataNote: 'ತಿಟ್ಟಂಕುಲಂ ಗ್ರಾಮ ಪಂಚಾಯಿತಿಯ ಅಧಿಕೃತ ದತ್ತಾಂಶವನ್ನು eGramSwaraj ಪೋರ್ಟಲ್‌ನಿಂದ ಪಡೆಯಲಾಗಿದೆ (LGD: 231907).', education: 'ಶಿಕ್ಷಣ', childCare: 'ಮಕ್ಕಳ ಆರೈಕೆ', health: 'ಆರೋಗ್ಯ', eGovernance: 'ಇ-ಆಡಳಿತ', sanitation: 'ನೈರ್ಮಲ್ಯ', publicDistribution: 'ಸಾರ್ವಜನಿಕ ವಿತರಣೆ', water: 'ನೀರು', community: 'ಸಮುದಾಯ', waterBody: 'ಜಲಮೂಲ', schoolPrimary: 'ಪಂಚಾಯತ್ ಯೂನಿಯನ್ ಪ್ರಾಥಮಿಕ ಶಾಲೆ', schoolMiddle: 'ಪಂಚಾಯತ್ ಯೂನಿಯನ್ ಮಧ್ಯಮ / ಪ್ರೌಢಶಾಲೆ', anganwadi: 'ಅಂಗನವಾಡಿ / ಪೂರ್ವ ಪ್ರಾಥಮಿಕ ಕೇಂದ್ರ', primaryHealth: 'ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರ', healthSubCentre: 'ಆರೋಗ್ಯ ಉಪಕೇಂದ್ರ', cscFacility: 'ಸಾಮಾನ್ಯ ಸೇವಾ ಕೇಂದ್ರ (CSC)', sanitaryComplex: 'ಸಮುದಾಯ ನೈರ್ಮಲ್ಯ ಸಂಕೀರ್ಣ', rationShop: 'ಪಡಿತರ ಅಂಗಡಿ (ನ್ಯಾಯಬೆಲೆ ಅಂಗಡಿ)', overheadTank: 'ಮೇಲ್ಮಟ್ಟದ ನೀರಿನ ಟ್ಯಾಂಕ್ (OHT)', communityHall: 'ಸಮುದಾಯ ಭವನ', templeTank: 'ದೇವಾಲಯದ ಕೆರೆ / ಊರಾಣಿ', office: 'ಪಂಚಾಯತ್ ಕಚೇರಿ', hours: 'ಸೋಮ–ಶುಕ್ರ, ಬೆಳಿಗ್ಗೆ 10:00 – ಸಂಜೆ 5:45', auditTeamLead: 'ಲೆಕ್ಕಪರಿಶೋಧನಾ ತಂಡ: ತೂತುಕುಡಿ ಕೋವಿಲ್ಪಟ್ಟಿ ತಿಟ್ಟಂಕುಲಂ', auditObservation: 'ಗಮನಿಕೆ (1): 10 - ಕಡಿತ ವಸೂಲಾತಿ ಮೊತ್ತ ಜಮೆಯಾಗಿಲ್ಲ', dyBdo: 'ಉಪ ಬ್ಲಾಕ್ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ', assistantDirectorAudit: 'ಸಹಾಯಕ ಲೆಕ್ಕಪರಿಶೋಧನಾ ನಿರ್ದೇಶಕರು (ಗ್ರಾಮೀಣಾಭಿವೃದ್ಧಿ)', localFundAudit: 'ಸಹಾಯಕ ನಿರ್ದೇಶಕರು (ಸ್ಥಳೀಯ ನಿಧಿ ಲೆಕ್ಕಪರಿಶೋಧನೆ)' },
  ml: { title: 'ഗ്രാമ പ്രൊഫൈൽ', edit: 'ഗ്രാമ വിവരങ്ങൾ തിരുത്തുക', block: 'ബ്ലോക്ക്', taluk: 'താലൂക്ക്', district: 'ജില്ല', location: 'ഭൂപടവും സ്ഥലവും', admin: 'പഞ്ചായത്ത് ഭരണം', contact: 'ബന്ധപ്പെടാനുള്ള വിവരങ്ങൾ', demographics: 'ജനസംഖ്യാ വിവരങ്ങൾ (ഇന്നത്തെ നിലയിൽ)', amenities: 'അടിസ്ഥാന സൗകര്യങ്ങളും ഡിജിറ്റൽ അടിസ്ഥാനസൗകര്യവും', development: 'വികസന അവലോകനം', facilities: 'പ്രധാന പൊതുസൗകര്യങ്ങൾ', audit: 'പദ്ധതി ഓഡിറ്റ് (15-ാം ധനകാര്യ കമ്മീഷൻ – 15FC)', population: 'ജനസംഖ്യ', households: 'കുടുംബങ്ങൾ', wards: 'വാർഡുകൾ', area: 'ആകെ വിസ്തീർണം', taps: 'കുടിവെള്ള കണക്ഷനുകൾ', toilets: 'വീട്ടിലെ ശൗചാലയങ്ങൾ', panchayat: 'പഞ്ചായത്ത്', lgdCode: 'LGD കോഡ്', revenueVillages: 'റവന്യൂ ഗ്രാമങ്ങൾ', secretary: 'സെക്രട്ടറി', secretaryMobile: 'സെക്രട്ടറിയുടെ മൊബൈൽ', joiningDate: 'ചേർന്ന തീയതി', busStop: 'സമീപത്തെ ബസ് സ്റ്റോപ്പ്', attractions: 'ഗ്രാമത്തിലെ ആകർഷണങ്ങൾ', malePopulation: 'പുരുഷ ജനസംഖ്യ', femalePopulation: 'സ്ത്രീ ജനസംഖ്യ', scPopulation: 'പട്ടികജാതി ജനസംഖ്യ', generalPopulation: 'പൊതു വിഭാഗത്തിലെ ജനസംഖ്യ', children06: 'കുട്ടികൾ (0–6 വയസ്)', children618: 'കുട്ടികൾ (6–18 വയസ്)', jobCards: 'ജോബ് കാർഡ് ഉടമകൾ', shgOldAge: 'സ്വയംസഹായ സംഘങ്ങൾ / വൃദ്ധസദനങ്ങൾ', panchayatBuilding: 'പഞ്ചായത്ത് ഭവനം', csc: 'CSC (കോമൺ സർവീസ് സെന്റർ)', computer: 'കമ്പ്യൂട്ടർ / സ്കാനർ / പ്രിന്റർ', library: 'പഞ്ചായത്ത് ലൈബ്രറി', rainwater: 'മേൽക്കൂരയിലെ മഴവെള്ള സംഭരണം', alternateWater: 'മറ്റൊരു ജലസ്രോതസ്സ്', internet: 'ഇന്റർനെറ്റ്, വൈദ്യുതി കണക്ഷൻ', available: 'ലഭ്യമാണ് (അതെ)', coLocated: 'ഭവനത്തിൽ പ്രവർത്തിക്കുന്നു', equipment: '1 കമ്പ്യൂട്ടർ, 1 സ്കാനർ, 1 പ്രിന്റർ', yes: 'അതെ', installed: 'സ്ഥാപിച്ചു (അതെ)', borewell: 'കുഴൽക്കിണർ', utilities: 'വൈദ്യുതി വിതരണം / സ്വകാര്യ ISP', viewActivities: '{count} പ്രവർത്തനങ്ങൾ കാണുക →', totalActivities: 'ആകെ പ്രവർത്തനങ്ങൾ', completed: 'പൂർത്തിയായി', inProgress: 'പുരോഗതിയിൽ', approvedPlanned: 'അംഗീകരിച്ചത് / ആസൂത്രണം ചെയ്തത്', noFacilities: 'സൗകര്യങ്ങളൊന്നും രേഖപ്പെടുത്തിയിട്ടില്ല.', auditTeam: 'ഓഡിറ്റ് സംഘം: തൂത്തുക്കുടി കോവിൽപ്പട്ടി തിത്തങ്കുളം', scheme: 'പദ്ധതി', auditPeriod: 'ഓഡിറ്റ് കാലയളവ്', teamMembers: 'ഓഡിറ്റ് സംഘാംഗങ്ങൾ:', observation: 'നിരീക്ഷണം (1): 10 - പിടിച്ചെടുത്ത തുകകൾ അടച്ചിട്ടില്ല', noLocation: 'സ്ഥലം ക്രമീകരിച്ചിട്ടില്ല.', approximate: 'ഏകദേശ സ്ഥലം', mapNote: 'മാതൃകാ ഭൂപടം: OpenStreetMap-ൽ ഗ്രാമത്തിന്റെ ഏകദേശ സ്ഥാനം അടയാളം കാണിക്കുന്നു. ഡാഷ് ചെയ്ത വൃത്തം സൂചന മാത്രമാണ്; ഇത് ഗ്രാമം, വാർഡ്, ഭൂമി സർവേ അതിർത്തിയല്ല. ഔദ്യോഗിക GIS പാളികൾ പിന്നീട് ചേർക്കാം.', description: 'തിത്തങ്കുളം (തെക്കൻ തിത്തങ്കുളം) തമിഴ്‌നാട്ടിലെ തൂത്തുക്കുടി ജില്ലയിലെ കോവിൽപ്പട്ടി താലൂക്കിലുള്ള ഗ്രാമപഞ്ചായത്താണ് (LGD കോഡ്: 231907). GPDP വികസന പദ്ധതികൾ, 15-ാം ധനകാര്യ കമ്മീഷൻ പ്രവർത്തനങ്ങൾ, ഖര-ദ്രവ മാലിന്യ സംസ്കരണം, JJM കുടിവെള്ള പൈപ്പ് വിതരണം, പൊതുസമ്പത്തുകൾ, ഗ്രാമസഭാ ഭരണം, പൗരപരാതി പരിഹാരം എന്നിവ ഈ ഔദ്യോഗിക പ്ലാറ്റ്‌ഫോം ഡിജിറ്റലായി നിരീക്ഷിക്കുന്നു.', dataNote: 'തിത്തങ്കുളം ഗ്രാമപഞ്ചായത്തിന്റെ ഔദ്യോഗിക വിവരങ്ങൾ eGramSwaraj പോർട്ടലിൽ നിന്നാണ് (LGD: 231907).', education: 'വിദ്യാഭ്യാസം', childCare: 'ശിശുപരിപാലനം', health: 'ആരോഗ്യം', eGovernance: 'ഇ-ഭരണം', sanitation: 'ശുചിത്വം', publicDistribution: 'പൊതുവിതരണം', water: 'ജലം', community: 'സമൂഹം', waterBody: 'ജലാശയം', schoolPrimary: 'പഞ്ചായത്ത് യൂണിയൻ പ്രൈമറി സ്കൂൾ', schoolMiddle: 'പഞ്ചായത്ത് യൂണിയൻ അപ്പർ പ്രൈമറി / സെക്കൻഡറി സ്കൂൾ', anganwadi: 'അങ്കണവാടി / പ്രീ-പ്രൈമറി കേന്ദ്രം', primaryHealth: 'പ്രാഥമികാരോഗ്യ കേന്ദ്രം', healthSubCentre: 'ആരോഗ്യ ഉപകേന്ദ്രം', cscFacility: 'കോമൺ സർവീസ് സെന്റർ (CSC)', sanitaryComplex: 'കമ്മ്യൂണിറ്റി സാനിറ്ററി കോംപ്ലക്സ്', rationShop: 'റേഷൻ കട (ന്യായവില കട)', overheadTank: 'ഓവർഹെഡ് വാട്ടർ ടാങ്ക് (OHT)', communityHall: 'കമ്മ്യൂണിറ്റി ഹാൾ', templeTank: 'ക്ഷേത്രക്കുളം / ഊരണി', office: 'പഞ്ചായത്ത് ഓഫീസ്', hours: 'തിങ്കൾ–വെള്ളി, രാവിലെ 10:00 – വൈകിട്ട് 5:45', auditTeamLead: 'ഓഡിറ്റ് സംഘം: തൂത്തുക്കുടി കോവിൽപ്പട്ടി തിത്തങ്കുളം', auditObservation: 'നിരീക്ഷണം (1): 10 - പിടിച്ചെടുത്ത തുകകൾ അടച്ചിട്ടില്ല', dyBdo: 'ഡെപ്യൂട്ടി ബ്ലോക്ക് ഡെവലപ്‌മെന്റ് ഓഫീസർ', assistantDirectorAudit: 'അസിസ്റ്റന്റ് ഡയറക്ടർ ഓഡിറ്റ് (ഗ്രാമവികസനം)', localFundAudit: 'അസിസ്റ്റന്റ് ഡയറക്ടർ (ലോക്കൽ ഫണ്ട് ഓഡിറ്റ്)' },
  mr: { title: 'ग्राम प्रोफाइल', edit: 'गावाची माहिती संपादित करा', block: 'ब्लॉक', taluk: 'तालुका', district: 'जिल्हा', location: 'नकाशा आणि स्थान', admin: 'पंचायत प्रशासन', contact: 'संपर्क माहिती', demographics: 'लोकसंख्येचा तपशील (आजच्या तारखेनुसार)', amenities: 'मूलभूत सुविधा आणि डिजिटल पायाभूत सुविधा', development: 'विकासाचा आढावा', facilities: 'महत्त्वाच्या सार्वजनिक सुविधा', audit: 'योजना लेखापरीक्षण (१५वा वित्त आयोग – 15FC)', population: 'लोकसंख्या', households: 'कुटुंबे', wards: 'वॉर्ड', area: 'एकूण क्षेत्रफळ', taps: 'नळ पाणी जोडण्या', toilets: 'घरगुती शौचालये', panchayat: 'पंचायत', lgdCode: 'LGD कोड', revenueVillages: 'महसुली गावे', secretary: 'सचिव', secretaryMobile: 'सचिवांचा मोबाइल', joiningDate: 'रुजू दिनांक', busStop: 'जवळचे बस स्थानक', attractions: 'ग्रामपंचायतीची आकर्षणे', malePopulation: 'पुरुष लोकसंख्या', femalePopulation: 'महिला लोकसंख्या', scPopulation: 'अनुसूचित जातीची लोकसंख्या', generalPopulation: 'सर्वसाधारण लोकसंख्या', children06: 'मुले (0–6 वर्षे)', children618: 'मुले (6–18 वर्षे)', jobCards: 'जॉब कार्डधारक', shgOldAge: 'बचत गट / वृद्धाश्रम संख्या', panchayatBuilding: 'पंचायत भवन', csc: 'CSC (सामान्य सेवा केंद्र)', computer: 'संगणक / स्कॅनर / प्रिंटर', library: 'पंचायत ग्रंथालय', rainwater: 'छतावरील पावसाचे पाणी साठवण', alternateWater: 'पर्यायी जलस्रोत', internet: 'इंटरनेट आणि वीज जोडणी', available: 'उपलब्ध (होय)', coLocated: 'भवनातच उपलब्ध', equipment: '1 संगणक, 1 स्कॅनर, 1 प्रिंटर', yes: 'होय', installed: 'बसवलेले (होय)', borewell: 'बोअरवेल', utilities: 'वीजपुरवठा / खाजगी ISP', viewActivities: '{count} कामे पहा →', totalActivities: 'एकूण कामे', completed: 'पूर्ण', inProgress: 'प्रगतीपथावर', approvedPlanned: 'मंजूर / नियोजित', noFacilities: 'कोणत्याही सुविधा नोंदवलेल्या नाहीत.', auditTeam: 'लेखापरीक्षण पथक: थूथुकुडी कोविलपट्टी थिट्टनकुलम', scheme: 'योजना', auditPeriod: 'लेखापरीक्षण कालावधी', teamMembers: 'लेखापरीक्षण पथकातील सदस्य:', observation: 'निरीक्षण (1): 10 - कपातींची वसुली जमा केली नाही', noLocation: 'स्थान निश्चित केलेले नाही.', approximate: 'अंदाजे स्थान', mapNote: 'प्रोटोटाइप नकाशा: OpenStreetMap वरील गावाचे अंदाजे स्थान चिन्ह दाखवते. तुटक वर्तुळ केवळ सूचक आहे; ती गाव, वॉर्ड किंवा भू-मोजणीची सीमा नाही. अधिकृत GIS स्तर नंतर जोडता येतील.', description: 'थिट्टनकुलम (दक्षिण थिट्टनकुलम) हे तमिळनाडूच्या थूथुकुडी जिल्ह्यातील कोविलपट्टी तालुक्यातील ग्रामपंचायत आहे (LGD कोड: 231907). हे अधिकृत व्यासपीठ GPDP विकास योजना, १५व्या वित्त आयोगाची कामे, घन व द्रव कचरा व्यवस्थापन, JJM अंतर्गत नळाद्वारे पाणीपुरवठा, सार्वजनिक मालमत्ता, ग्रामसभा प्रशासन आणि नागरिकांच्या तक्रारींचे निराकरण यांचा डिजिटल मागोवा देते.', dataNote: 'थिट्टनकुलम ग्रामपंचायतीची अधिकृत माहिती eGramSwaraj पोर्टलवरून घेतली आहे (LGD: 231907).', education: 'शिक्षण', childCare: 'बालसंगोपन', health: 'आरोग्य', eGovernance: 'ई-प्रशासन', sanitation: 'स्वच्छता', publicDistribution: 'सार्वजनिक वितरण', water: 'पाणी', community: 'समुदाय', waterBody: 'जलस्रोत', schoolPrimary: 'पंचायत युनियन प्राथमिक शाळा', schoolMiddle: 'पंचायत युनियन माध्यमिक शाळा', anganwadi: 'अंगणवाडी / पूर्व-प्राथमिक केंद्र', primaryHealth: 'प्राथमिक आरोग्य केंद्र', healthSubCentre: 'आरोग्य उपकेंद्र', cscFacility: 'सामान्य सेवा केंद्र (CSC)', sanitaryComplex: 'सामुदायिक स्वच्छता संकुल', rationShop: 'रेशन दुकान (स्वस्त धान्य दुकान)', overheadTank: 'उंच पाण्याची टाकी (OHT)', communityHall: 'समुदाय भवन', templeTank: 'मंदिर तलाव / ऊराणी', office: 'पंचायत कार्यालय', hours: 'सोम–शुक्र, सकाळी 10:00 – संध्याकाळी 5:45', auditTeamLead: 'लेखापरीक्षण पथक: थूथुकुडी कोविलपट्टी थिट्टनकुलम', auditObservation: 'निरीक्षण (1): 10 - कपातींची वसुली जमा केली नाही', dyBdo: 'उप गट विकास अधिकारी', assistantDirectorAudit: 'सहाय्यक लेखापरीक्षण संचालक (ग्रामीण विकास)', localFundAudit: 'सहाय्यक संचालक (स्थानिक निधी लेखापरीक्षण)' },
  bn: { title: 'গ্রাম পরিচিতি', edit: 'গ্রামের তথ্য সম্পাদনা করুন', block: 'ব্লক', taluk: 'তালুক', district: 'জেলা', location: 'মানচিত্র ও অবস্থান', admin: 'পঞ্চায়েত প্রশাসন', contact: 'যোগাযোগের তথ্য', demographics: 'জনসংখ্যার বিবরণ (আজকের তারিখ অনুযায়ী)', amenities: 'মৌলিক সুবিধা ও ডিজিটাল পরিকাঠামো', development: 'উন্নয়নের সারসংক্ষেপ', facilities: 'গুরুত্বপূর্ণ জনসাধারণের সুবিধা', audit: 'প্রকল্প নিরীক্ষা (১৫তম অর্থ কমিশন – 15FC)', population: 'জনসংখ্যা', households: 'পরিবার', wards: 'ওয়ার্ড', area: 'মোট এলাকা', taps: 'নলজলের সংযোগ', toilets: 'বাড়ির শৌচাগার', panchayat: 'পঞ্চায়েত', lgdCode: 'LGD কোড', revenueVillages: 'রাজস্ব গ্রাম', secretary: 'সচিব', secretaryMobile: 'সচিবের মোবাইল', joiningDate: 'যোগদানের তারিখ', busStop: 'নিকটতম বাসস্টপ', attractions: 'গ্রাম পঞ্চায়েতের দর্শনীয় স্থান', malePopulation: 'পুরুষ জনসংখ্যা', femalePopulation: 'মহিলা জনসংখ্যা', scPopulation: 'তফসিলি জাতির জনসংখ্যা', generalPopulation: 'সাধারণ জনসংখ্যা', children06: 'শিশু (0–6 বছর)', children618: 'শিশু (6–18 বছর)', jobCards: 'জব কার্ডধারী', shgOldAge: 'স্বনির্ভর গোষ্ঠী / বৃদ্ধাশ্রমের সংখ্যা', panchayatBuilding: 'পঞ্চায়েত ভবন', csc: 'CSC (কমন সার্ভিস সেন্টার)', computer: 'কম্পিউটার / স্ক্যানার / প্রিন্টার', library: 'পঞ্চায়েত লাইব্রেরি', rainwater: 'ছাদের বৃষ্টির জল সংরক্ষণ', alternateWater: 'বিকল্প জলের উৎস', internet: 'ইন্টারনেট ও বিদ্যুৎ সংযোগ', available: 'উপলব্ধ (হ্যাঁ)', coLocated: 'ভবনেই রয়েছে', equipment: '1 কম্পিউটার, 1 স্ক্যানার, 1 প্রিন্টার', yes: 'হ্যাঁ', installed: 'স্থাপিত (হ্যাঁ)', borewell: 'নলকূপ', utilities: 'বিদ্যুৎ সরবরাহ / বেসরকারি ISP', viewActivities: '{count}টি কাজ দেখুন →', totalActivities: 'মোট কাজ', completed: 'সম্পন্ন', inProgress: 'চলছে', approvedPlanned: 'অনুমোদিত / পরিকল্পিত', noFacilities: 'কোনো সুবিধার তথ্য নেই।', auditTeam: 'নিরীক্ষা দল: তুতিকোরিন কোভিলপট্টি থিত্তানকুলাম', scheme: 'প্রকল্প', auditPeriod: 'নিরীক্ষার সময়কাল', teamMembers: 'নিরীক্ষা দলের সদস্যরা:', observation: 'পর্যবেক্ষণ (1): 10 - কর্তনের টাকা জমা হয়নি', noLocation: 'অবস্থান নির্ধারিত নেই।', approximate: 'আনুমানিক অবস্থান', mapNote: 'নমুনা মানচিত্র: OpenStreetMap-এ চিহ্নটি গ্রামের আনুমানিক অবস্থান দেখায়। ড্যাশযুক্ত বৃত্তটি কেবল নির্দেশক; এটি গ্রাম, ওয়ার্ড বা ভূমি জরিপের সীমানা নয়। সরকারি GIS স্তর পরে যোগ করা যেতে পারে।', description: 'থিত্তানকুলাম (দক্ষিণ থিত্তানকুলাম) তামিলনাড়ুর তুতিকোরিন জেলার কোভিলপট্টি তালুকের একটি গ্রাম পঞ্চায়েত (LGD কোড: 231907)। এই সরকারি প্ল্যাটফর্মে GPDP উন্নয়ন পরিকল্পনা, ১৫তম অর্থ কমিশনের কাজ, কঠিন ও তরল বর্জ্য ব্যবস্থাপনা, JJM-এর নলবাহিত জল সরবরাহ, জনসম্পদ, গ্রামসভা পরিচালনা এবং নাগরিক অভিযোগের ডিজিটাল পর্যবেক্ষণ করা হয়।', dataNote: 'থিত্তানকুলাম গ্রাম পঞ্চায়েতের সরকারি তথ্য eGramSwaraj পোর্টাল থেকে নেওয়া হয়েছে (LGD: 231907)।', education: 'শিক্ষা', childCare: 'শিশু পরিচর্যা', health: 'স্বাস্থ্য', eGovernance: 'ই-শাসন', sanitation: 'পরিচ্ছন্নতা', publicDistribution: 'গণবণ্টন', water: 'জল', community: 'সম্প্রদায়', waterBody: 'জলাশয়', schoolPrimary: 'পঞ্চায়েত ইউনিয়ন প্রাথমিক বিদ্যালয়', schoolMiddle: 'পঞ্চায়েত ইউনিয়ন মধ্য / মাধ্যমিক বিদ্যালয়', anganwadi: 'অঙ্গনওয়াড়ি / প্রাক-প্রাথমিক কেন্দ্র', primaryHealth: 'প্রাথমিক স্বাস্থ্যকেন্দ্র', healthSubCentre: 'স্বাস্থ্য উপকেন্দ্র', cscFacility: 'কমন সার্ভিস সেন্টার (CSC)', sanitaryComplex: 'কমিউনিটি স্যানিটারি কমপ্লেক্স', rationShop: 'রেশন দোকান (ন্যায্যমূল্যের দোকান)', overheadTank: 'ওভারহেড জলের ট্যাঙ্ক (OHT)', communityHall: 'কমিউনিটি হল', templeTank: 'মন্দিরের পুকুর / উরানি', office: 'পঞ্চায়েত কার্যালয়', hours: 'সোম–শুক্র, সকাল 10:00 – বিকেল 5:45', auditTeamLead: 'নিরীক্ষা দল: তুতিকোরিন কোভিলপট্টি থিত্তানকুলাম', auditObservation: 'পর্যবেক্ষণ (1): 10 - কর্তনের টাকা জমা হয়নি', dyBdo: 'উপ-ব্লক উন্নয়ন আধিকারিক', assistantDirectorAudit: 'সহকারী নিরীক্ষা পরিচালক (গ্রামীণ উন্নয়ন)', localFundAudit: 'সহকারী পরিচালক (স্থানীয় তহবিল নিরীক্ষা)' },
};

const PROFILE_PLACES = {
  'South Thittankulam': { hi: 'दक्षिण थिट्टनकुलम', ta: 'தெற்கு திட்டங்குளம்', te: 'దక్షిణ తిట్టంకుళం', kn: 'ದಕ್ಷಿಣ ತಿಟ್ಟಂಕುಲಂ', ml: 'തെക്കൻ തിത്തങ്കുളം', mr: 'दक्षिण थिट्टनकुलम', bn: 'দক্ষিণ থিত্তানকুলাম' },
  Thittankulam: { hi: 'थिट्टनकुलम', ta: 'திட்டங்குளம்', te: 'తిట్టంకుళం', kn: 'ತಿಟ್ಟಂಕುಲಂ', ml: 'തിത്തങ്കുളം', mr: 'थिट्टनकुलम', bn: 'থিত্তানকুলাম' },
  Kovilpatti: { hi: 'कोविलपट्टी', ta: 'கோவில்பட்டி', te: 'కోవిల్పట్టి', kn: 'ಕೋವಿಲ್ಪಟ್ಟಿ', ml: 'കോവിൽപ്പട്ടി', mr: 'कोविलपट्टी', bn: 'কোভিলপট্টি' },
  Thoothukkudi: { hi: 'थूथुक्कुडी', ta: 'தூத்துக்குடி', te: 'తూత్తుకుడి', kn: 'ತೂತುಕುಡಿ', ml: 'തൂത്തുക്കുടി', mr: 'थूथुकुडी', bn: 'তুতিকোরিন' },
  'Tamil Nadu': { hi: 'तमिलनाडु', ta: 'தமிழ்நாடு', te: 'తమిళనాడు', kn: 'ತಮಿಳುನಾಡು', ml: 'തമിഴ്നാട്', mr: 'तामिळनाडू', bn: 'তামিলনাড়ু' },
  India: { hi: 'भारत', ta: 'இந்தியா', te: 'భారతదేశం', kn: 'ಭಾರತ', ml: 'ഇന്ത്യ', mr: 'भारत', bn: 'ভারত' },
};

const FACILITY_COPY = {
  'Panchayat Union Primary School': 'schoolPrimary',
  'Panchayat Union Middle / Secondary School': 'schoolMiddle',
  'Anganwadi / Pre-Primary Centre': 'anganwadi',
  'Primary Health Centre': 'primaryHealth',
  'Health Sub-Centre': 'healthSubCentre',
  'Common Service Centre (CSC)': 'cscFacility',
  'Community Sanitary Complex': 'sanitaryComplex',
  'Ration Shop (Fair Price Shop)': 'rationShop',
  'Overhead Water Tank (OHT)': 'overheadTank',
  'Community Hall': 'communityHall',
  'Panchayat Library': 'library',
  'Temple Tank / Oorani': 'templeTank',
};

const FACILITY_TYPE_COPY = { Education: 'education', 'Child Care': 'childCare', Health: 'health', 'e-Governance': 'eGovernance', Sanitation: 'sanitation', 'Public Distribution': 'publicDistribution', Water: 'water', Community: 'community', 'Water Body': 'waterBody' };

function translatedValue(value, language, dictionary) {
  return dictionary?.[value]?.[language] || value;
}

export function VillageMap({ village, assets = [] }) {
  const { language } = useLanguage();
  const copy = PROFILE_TEXT[language] || PROFILE_TEXT.en;
  if (village.latitude == null || village.longitude == null) return <p className="p-5 text-sm text-slate-500">{copy.noLocation}</p>;
  const center = [village.latitude, village.longitude];
  const villageName = translatedValue(village.name, language, PROFILE_PLACES);
  const taluk = translatedValue(village.taluk, language, PROFILE_PLACES);
  const state = translatedValue(village.state, language, PROFILE_PLACES);
  return (
    <div>
      <div className="relative z-0 h-72 overflow-hidden rounded-md sm:h-96">
        <MapContainer center={center} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {/* Indicative radius only — NOT a village or cadastral boundary */}
          <Circle center={center} radius={900} pathOptions={{ color: '#1c3d76', weight: 1, dashArray: '4 6', fillOpacity: 0.04 }} />
          <CircleMarker center={center} radius={9} pathOptions={{ color: '#fff', weight: 2, fillColor: '#f28c28', fillOpacity: 1 }}>
            <Popup><b>{villageName}</b><br />{taluk}, {state} – {village.pincode}<br /><i>{copy.approximate}</i></Popup>
          </CircleMarker>
          {assets.filter((a) => a.latitude && a.longitude).map((a) => (
            <CircleMarker key={a._id} center={[a.latitude, a.longitude]} radius={6} pathOptions={{ color: '#fff', weight: 2, fillColor: '#2a78d6', fillOpacity: 1 }}>
              <Popup>{a.name}<br />{a.type}</Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <p className="mt-2 text-xs text-slate-500">{copy.mapNote}</p>
    </div>
  );
}

export default function VillageProfile() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const copy = PROFILE_TEXT[language] || PROFILE_TEXT.en;
  const text = (key) => copy[key] || PROFILE_TEXT.en[key] || key;
  const place = (value) => translatedValue(value, language, PROFILE_PLACES);
  const { data: v, loading, error, reload } = useFetch('/villages/current');
  const { data: dev } = useFetch(isCitizen(user) ? '/reports/public' : '/reports/development');
  const devSummary = dev?.development?.summary || dev?.summary;

  return (
    <div>
      <PageHeader
        title={text('title')}
        subtitle={`${place('Thittankulam')} · LGD: ${v?.lgdCode || '231907'} · ${place('Kovilpatti')} · ${place('Thoothukkudi')} · ${place('Tamil Nadu')} · 628502`}
        icon={Landmark}
        actions={isAdmin(user) && <Link to="/village/info" className="btn-primary"><Pencil className="h-4 w-4" /> {text('edit')}</Link>}
      />
      <AsyncBoundary loading={loading} error={error} onRetry={reload}>
        {v && (
          <div className="space-y-5">
            {v.dataNote && <DemoNotice>{text('dataNote')}</DemoNotice>}
            
            <section className="card overflow-hidden">
              <div className="tricolor h-1" />
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-saffron-600">{text('panchayatBuilding')}, {place('Thittankulam')}</p>
                  <span className="inline-flex items-center rounded-md bg-gov-50 px-2.5 py-0.5 text-xs font-semibold text-gov-800">
                    {text('lgdCode')}: {v.lgdCode || '231907'}
                  </span>
                </div>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">{place(v.name)}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {v.block && `${place(v.block)} ${text('block')} · `}{place(v.taluk)} {text('taluk')} · {v.district && `${place(v.district)} ${text('district')} · `}{place(v.state)} · {place(v.country)} – {v.pincode}
                </p>
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-700">{v.description?.startsWith('Thittankulam (South Thittankulam)') ? text('description') : v.description}</p>
              </div>
            </section>

            {/* Core Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard label={text('population')} value={formatNumber(v.population || 14317)} icon={Users} />
              <StatCard label={text('households')} value={formatNumber(v.households || 5386)} icon={Home} />
              <StatCard label={text('wards')} value={formatNumber(v.wards || 9)} icon={Layers} />
              <StatCard label={text('area')} value={v.area ? `${v.area} km²` : '4.0 km²'} icon={Ruler} />
              <StatCard label={text('taps')} value={formatNumber(v.demographics?.householdsConnectedTapWater || 4545)} icon={Home} />
              <StatCard label={text('toilets')} value={formatNumber(v.demographics?.householdToilets || 3850)} icon={Home} />
            </div>

            {/* Demographics & Panchayat Details Grid */}
            <div className="grid gap-5 lg:grid-cols-3">
              <Card title={<span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gov-700" /> {text('location')}</span>} className="lg:col-span-2">
                <VillageMap village={v} />
              </Card>

              <div className="space-y-5">
                <Card title={text('admin')}>
                  <DetailGrid items={[
                    [text('panchayat'), `${text('panchayatBuilding')}, ${place('Thittankulam')}`],
                    [text('lgdCode'), v.lgdCode || '231907'],
                    [text('revenueVillages'), v.revenueVillages || 4],
                    [text('secretary'), v.secretaryName || v.secretary?.name || 'Ramesh'],
                    [text('secretaryMobile'), v.secretary?.mobile || '9780008087'],
                    [text('joiningDate'), v.secretary?.joiningDate || '20-03-2007'],
                    [text('busStop'), `${v.distanceToBusStop || 3} Km`],
                    [text('attractions'), language === 'en' ? (v.attractions || 'senbagavalli temple') : (language === 'ta' ? 'செண்பகவல்லி அம்மன் கோவில்' : language === 'hi' ? 'सेनबगवल्ली मंदिर' : language === 'te' ? 'సెన్బగవల్లి ఆలయం' : language === 'kn' ? 'ಸೆண்பಗವಲ್ಲಿ ದೇವಸ್ಥಾನ' : language === 'ml' ? 'സെൺബഗവല്ലി ക്ഷേത്രം' : language === 'mr' ? 'सेनबगवल्ली मंदिर' : 'সেনবগভল্লী মন্দির')],
                  ]} />
                </Card>

                <Card title={text('contact')}>
                  <ul className="space-y-2.5 text-sm text-slate-700">
                    <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{text('office')}, {place('Thittankulam')}, {place('Kovilpatti')} – 628502</li>
                    <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{v.contact?.phone || '7350000322'}</li>
                    <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{v.contact?.email || 'tutkpti.tnbdo@nic.in'}</li>
                    <li className="flex gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{text('hours')}</li>
                  </ul>
                </Card>
              </div>
            </div>

            {/* Demographics Breakdown & Amenities */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <Card title={text('demographics')}>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-slate-50 p-2.5">
                    <p className="text-xs text-slate-500">{text('malePopulation')}</p>
                    <p className="text-base font-semibold text-slate-900">{formatNumber(v.demographics?.male || 7100)}</p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-2.5">
                    <p className="text-xs text-slate-500">{text('femalePopulation')}</p>
                    <p className="text-base font-semibold text-slate-900">{formatNumber(v.demographics?.female || 7217)}</p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-2.5">
                    <p className="text-xs text-slate-500">{text('scPopulation')}</p>
                    <p className="text-base font-semibold text-slate-900">{formatNumber(v.demographics?.sc || 5202)}</p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-2.5">
                    <p className="text-xs text-slate-500">{text('generalPopulation')}</p>
                    <p className="text-base font-semibold text-slate-900">{formatNumber(v.demographics?.general || 9115)}</p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-2.5">
                    <p className="text-xs text-slate-500">{text('children06')}</p>
                    <p className="text-base font-semibold text-slate-900">{formatNumber(v.demographics?.children0to6 || 112)}</p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-2.5">
                    <p className="text-xs text-slate-500">{text('children618')}</p>
                    <p className="text-base font-semibold text-slate-900">{formatNumber(v.demographics?.children6to18 || 325)}</p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-2.5">
                    <p className="text-xs text-slate-500">{text('jobCards')}</p>
                    <p className="text-base font-semibold text-slate-900">{formatNumber(v.demographics?.jobCardHolders || 1125)}</p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-2.5">
                    <p className="text-xs text-slate-500">{text('shgOldAge')}</p>
                    <p className="text-base font-semibold text-slate-900">{v.demographics?.shg || 2} SHG / {v.demographics?.oldAgeHomes || 25} {language === 'en' ? 'Homes' : language === 'ta' ? 'இல்லங்கள்' : language === 'hi' ? 'घर' : language === 'te' ? 'గృహాలు' : language === 'kn' ? 'ಮನೆಗಳು' : language === 'ml' ? 'വീടുകൾ' : language === 'mr' ? 'घरे' : 'টি বাড়ি'}</p>
                  </div>
                </div>
              </Card>

              <Card title={text('amenities')}>
                <ul className="divide-y divide-slate-100 text-sm">
                  <li className="flex justify-between py-1.5"><span className="text-slate-600">{text('panchayatBuilding')}</span><span className="font-medium text-gov-800">{text('available')}</span></li>
                  <li className="flex justify-between py-1.5"><span className="text-slate-600">{text('csc')}</span><span className="font-medium text-gov-800">{text('coLocated')}</span></li>
                  <li className="flex justify-between py-1.5"><span className="text-slate-600">{text('computer')}</span><span className="font-medium text-gov-800">{text('equipment')}</span></li>
                  <li className="flex justify-between py-1.5"><span className="text-slate-600">{text('library')}</span><span className="font-medium text-gov-800">{text('yes')}</span></li>
                  <li className="flex justify-between py-1.5"><span className="text-slate-600">{text('rainwater')}</span><span className="font-medium text-gov-800">{text('installed')}</span></li>
                  <li className="flex justify-between py-1.5"><span className="text-slate-600">{text('alternateWater')}</span><span className="font-medium text-gov-800">{text('borewell')}</span></li>
                  <li className="flex justify-between py-1.5"><span className="text-slate-600">{text('internet')}</span><span className="font-medium text-gov-800">{text('utilities')}</span></li>
                </ul>
              </Card>

              <Card title={text('development')} actions={<Link to="/works" className="text-xs font-medium text-gov-700 hover:underline">{text('viewActivities').replace('{count}', String(devSummary?.totalProjects || 116))}</Link>}>
                {devSummary ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      [text('totalActivities'), devSummary.totalProjects || 116],
                      [text('completed'), devSummary.completed || 2],
                      [text('inProgress'), devSummary.inProgress || 8],
                      [text('approvedPlanned'), (devSummary.totalProjects || 116) - (devSummary.completed || 2) - (devSummary.inProgress || 8)],
                    ].map(([l, n]) => (
                      <div key={l} className="rounded-md bg-slate-50 p-3">
                        <p className="text-2xl font-semibold tabular-nums text-slate-900">{n}</p>
                        <p className="text-xs text-slate-500">{l}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-500">{language === 'ta' ? 'மேலோட்டம் ஏற்றப்படுகிறது…' : language === 'hi' ? 'विवरण लोड हो रहा है…' : language === 'te' ? 'అవలోకనం లోడ్ అవుతోంది…' : language === 'kn' ? 'ಅವಲೋಕನ ಲೋಡ್ ಆಗುತ್ತಿದೆ…' : language === 'ml' ? 'അവലോകനം ലോഡ് ചെയ്യുന്നു…' : language === 'mr' ? 'आढावा लोड होत आहे…' : language === 'bn' ? 'সারসংক্ষেপ লোড হচ্ছে…' : 'Loading overview…'}</p>}
              </Card>
            </div>

            {/* Facilities & Audit Section */}
            <div className="grid gap-5 lg:grid-cols-2">
              <Card title={text('facilities')}>
                {v.facilities?.length ? (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {v.facilities.map((f) => (
                      <li key={f._id || f.name} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                        <span>
                          <span className="block text-sm font-medium text-slate-800">{FACILITY_COPY[f.name] ? text(FACILITY_COPY[f.name]) : f.name}</span>
                          <span className="text-xs text-slate-500">{FACILITY_TYPE_COPY[f.type] ? text(FACILITY_TYPE_COPY[f.type]) : f.type}</span>
                        </span>
                        <span className="text-lg font-semibold tabular-nums text-gov-700">{f.count}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-slate-500">{text('noFacilities')}</p>}
              </Card>

              <Card title={text('audit')}>
                <div className="space-y-3 text-sm">
                  <div className="rounded-md bg-slate-50 p-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-900">{text('auditTeamLead')}</span>
                      <span className="rounded bg-gov-100 px-2 py-0.5 text-xs font-medium text-gov-800">2024–2025</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{text('scheme')}: <b>15FC</b> | {text('auditPeriod')}: <b>18/08/2025 – 19/08/2025</b></p>
                    <p className="mt-2 text-xs font-medium text-slate-700">{text('teamMembers')}</p>
                    <ul className="mt-1 list-disc pl-5 text-xs text-slate-600 space-y-0.5">
                      <li>Aruna Chandrasekar – {text('dyBdo')}</li>
                      <li>K Palani – {text('assistantDirectorAudit')}</li>
                      <li>M Ravichandran – {text('localFundAudit')}</li>
                    </ul>
                    <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                      <b>{text('auditObservation')}</b>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}

