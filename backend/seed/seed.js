/**
 * Official eGramSwaraj Seed Data for Thittankulam / South Thittankulam Village Panchayat
 * LGD Code: 231907 | Kovilpatti Block & Taluk | Thoothukkudi District | Tamil Nadu
 */
const { connectDB, sequelize } = require('../config/db');
const { activeVillageCode } = require('../config/env');
const M = require('../models');
const { recalcAll } = require('../services/budgetService');
const { financialYearOf } = require('../utils/query');
const { REAL_ACTIVITIES, REAL_ASSETS } = require('./realData');

const DAY = 86400000;
const d = (offsetDays, hour = 10) => { const t = new Date(Date.now() + offsetDays * DAY); t.setHours(hour, 0, 0, 0); return t; };

async function seed() {
  await connectDB();
  console.log('[seed] Seeding official eGramSwaraj data for Thittankulam Village Panchayat (LGD: 231907)…');

  // ---------- Reset Village & Collections ----------
  let village = await M.Village.findOne({ villageCode: activeVillageCode });
  if (village) {
    const vid = village._id;
    const scoped = ['Citizen', 'DevelopmentPlan', 'Work', 'Asset', 'FinancialTransaction', 'Budget', 'Meeting', 'Grievance', 'Notification', 'Announcement', 'User'];
    for (const name of scoped) await M[name].deleteMany({ villageId: vid });
    await M.Counter.deleteMany({ _id: new RegExp(`^grievance-${vid}-`) });
    await M.Village.deleteOne({ _id: vid });
  }

  // ---------- 1. Village Profile (Real eGramSwaraj Data) ----------
  village = await M.Village.create({
    name: 'South Thittankulam',
    villageCode: activeVillageCode,
    panchayatName: 'Thittankulam Village Panchayat',
    lgdCode: '231907',
    block: 'Kovilpatti',
    taluk: 'Kovilpatti',
    district: 'Thoothukkudi',
    state: 'Tamil Nadu',
    country: 'India',
    pincode: '628502',
    population: 14317,
    households: 5386,
    wards: 9,
    area: 4.0,
    revenueVillages: 4,
    distanceToBusStop: 3,
    attractions: 'senbagavalli temple',
    latitude: 9.173102,
    longitude: 77.892810,
    locationIsApproximate: false,
    description: 'Thittankulam (South Thittankulam) is a vibrant Village Panchayat in Kovilpatti Taluk, Thoothukkudi District, Tamil Nadu (LGD Code: 231907). '
      + 'This official platform provides digital tracking for GPDP developmental plans, 15th Finance Commission works, liquid & solid waste management, '
      + 'piped water supply under JJM, public assets, Gram Sabha governance, and citizen grievance redressal.',
    presidentName: 'Panchayat President',
    secretaryName: 'Ramesh',
    secretary: {
      name: 'Ramesh',
      designation: 'Secretary',
      gender: 'Male',
      mobile: '9780008087',
      email: 'tutkpti.tnbdo@gmail.com',
      joiningDate: '20-03-2007',
    },
    contact: {
      officeAddress: 'Panchayat Office, Thittankulam, Kovilpatti Taluk, Thoothukkudi District, Tamil Nadu – 628502',
      phone: '7350000322',
      email: 'tutkpti.tnbdo@nic.in',
      officeHours: 'Mon–Fri, 10:00 AM – 5:45 PM',
    },
    demographics: {
      male: 7100,
      female: 7217,
      transgender: 0,
      sc: 5202,
      st: 0,
      obc: 0,
      general: 9115,
      children0to6: 112,
      children6to18: 325,
      shg: 2,
      oldAgeHomes: 25,
      jobCardHolders: 1125,
      householdsConnectedTapWater: 4545,
      householdToilets: 3850,
      drinkingWaterSources: 1,
    },
    basicAmenities: {
      library: true,
      panchayatBhawan: true,
      computers: 1,
      laptops: 0,
      scanners: 1,
      printers: 1,
      cscAvailable: true,
      cscLocation: 'Co-located in Panchayat Bhawan',
      osrCollected: 0,
      alternateWaterSource: 'Borewell',
      rainwaterHarvesting: true,
      renewableEnergy: false,
      powerSupply: 'Electric supply',
      internetService: true,
      internetSource: 'Private internet service provider',
    },
    facilities: [
      { name: 'Panchayat Union Primary School', type: 'Education', count: 1 },
      { name: 'Panchayat Union Middle / Secondary School', type: 'Education', count: 2 },
      { name: 'Anganwadi / Pre-Primary Centre', type: 'Child Care', count: 3 },
      { name: 'Primary Health Centre', type: 'Health', count: 1 },
      { name: 'Health Sub-Centre', type: 'Health', count: 1 },
      { name: 'Common Service Centre (CSC)', type: 'e-Governance', count: 1 },
      { name: 'Community Sanitary Complex', type: 'Sanitation', count: 1 },
      { name: 'Ration Shop (Fair Price Shop)', type: 'Public Distribution', count: 1 },
      { name: 'Overhead Water Tank (OHT)', type: 'Water', count: 3 },
      { name: 'Community Hall', type: 'Community', count: 1 },
      { name: 'Panchayat Library', type: 'Education', count: 1 },
      { name: 'Temple Tank / Oorani', type: 'Water Body', count: 2 },
    ],
    audit: [
      {
        auditorName: 'Aruna Chandrasekar',
        auditorDesignation: 'Dy. Block Development Officer',
        auditTeamName: 'Thoothukudi Kovilpatti Thittankulam 2024-2025',
        schemeName: '15FC',
        auditPeriod: '2024-2025',
        startDate: '18/08/2025',
        endDate: '19/08/2025',
        observationCategory: '10 - Non remittance of deductions recoveries',
        observationCount: 1,
      },
      {
        auditorName: 'K Palani',
        auditorDesignation: 'Assistant Director Audit ( RD )',
        auditTeamName: 'Thoothukudi Kovilpatti Thittankulam 2024-2025',
        schemeName: '15FC',
        auditPeriod: '2024-2025',
        startDate: '18/08/2025',
        endDate: '19/08/2025',
        observationCategory: '10 - Non remittance of deductions recoveries',
        observationCount: 1,
      },
      {
        auditorName: 'M Ravichandran',
        auditorDesignation: 'Assistant Director (Local Fund Audit)',
        auditTeamName: 'Thoothukudi Kovilpatti Thittankulam 2024-2025',
        schemeName: '15FC',
        auditPeriod: '2024-2025',
        startDate: '18/08/2025',
        endDate: '19/08/2025',
        observationCategory: '10 - Non remittance of deductions recoveries',
        observationCount: 1,
      },
    ],
    dataNote: 'Official data sourced from eGramSwaraj portal for Thittankulam Village Panchayat (LGD: 231907).',
    isDemo: false,
  });

  const vid = village._id;
  const V = { villageId: vid, isDemo: false };
  console.log(`[seed] Village created: ${village.name} (LGD: ${village.lgdCode}, ID: ${vid})`);

  // ---------- 2. Users (Officials & Citizens) ----------
  const mkUser = (u) => new M.User({ ...V, status: 'ACTIVE', ...u }).save();
  const admin = await mkUser({ name: 'Block Development Officer', email: 'admin@stk.gov.demo', password: 'Admin@123', role: 'ADMIN', phone: '7350000322', designation: 'Block Development Officer (Kovilpatti)' });
  const secretary = await mkUser({ name: 'Ramesh', email: 'tutkpti.tnbdo@gmail.com', password: 'Officer@123', role: 'PANCHAYAT_OFFICER', phone: '9780008087', designation: 'Panchayat Secretary' });
  const officerAlt = await mkUser({ name: 'Panchayat Officer', email: 'officer@stk.gov.demo', password: 'Officer@123', role: 'PANCHAYAT_OFFICER', phone: '9000000002', designation: 'Panchayat Secretary' });
  const staff1 = await mkUser({ name: 'R. Selvam', email: 'staff@stk.gov.demo', password: 'Staff@123', role: 'STAFF', phone: '9000000003', designation: 'Overseer / Work Supervisor' });
  const staff2 = await mkUser({ name: 'P. Karthik', email: 'staff2@stk.gov.demo', password: 'Staff@123', role: 'STAFF', phone: '9000000004', designation: 'Water Supply Operator' });

  const citizenSeed = [
    ['S. Murugan', 'citizen@stk.gov.demo', '9000000011', 'Ward 1', 'MALE', 'North Street'],
    ['M. Lakshmi', 'lakshmi@stk.gov.demo', '9000000012', 'Ward 2', 'FEMALE', 'Kovil Street'],
    ['A. Ganesan', 'ganesan@stk.gov.demo', '9000000013', 'Ward 3', 'MALE', 'Muthu Nagar'],
    ['V. Kalaiselvi', 'kalaiselvi@stk.gov.demo', '9000000014', 'Ward 4', 'FEMALE', 'School Street'],
    ['T. Ramesh', 'ramesh.c@stk.gov.demo', '9000000015', 'Ward 5', 'MALE', 'Kulam Street'],
    ['J. Priya', 'priya@stk.gov.demo', '9000000016', 'Ward 6', 'FEMALE', 'East Street'],
    ['K. Pandi', 'pandi@stk.gov.demo', '9000000017', 'Ward 7', 'MALE', 'Ponthotta Colony'],
    ['S. Valli', 'valli@stk.gov.demo', '9000000018', 'Ward 8', 'FEMALE', 'Sanmuga Nagar'],
    ['R. Chinnasamy', 'chinnasamy@stk.gov.demo', '9000000019', 'Ward 9', 'MALE', 'Mela Colony'],
  ];

  const citizens = [];
  const citizenUsers = [];
  for (const [name, email, phone, ward, gender, street] of citizenSeed) {
    const u = await mkUser({ name, email, password: 'Citizen@123', role: 'CITIZEN', phone });
    citizenUsers.push(u);
    citizens.push(await M.Citizen.create({ ...V, name, email, phone, ward, gender, address: `${street}, Thittankulam`, userId: u._id }));
  }

  // Walk-in citizens without login accounts
  for (const [name, ward, gender] of [['M. Saroja', 'Ward 1', 'FEMALE'], ['K. Marimuthu', 'Ward 3', 'MALE'], ['P. Subbulakshmi', 'Ward 5', 'FEMALE']]) {
    citizens.push(await M.Citizen.create({ ...V, name, ward, gender, phone: `90000001${citizens.length}`.slice(0, 10), address: `${ward}, Thittankulam` }));
  }
  console.log(`[seed] Users: 5 officials, ${citizenUsers.length} citizen accounts, ${citizens.length} registered citizen records`);

  // ---------- 3. Development Plans (GPDP Plans) ----------
  const fy = financialYearOf();
  const planDefinitions = [
    { title: 'GPDP: Comprehensive Water Supply & Pipeline Extension', category: 'Water', priority: 'CRITICAL', estimatedCost: 4500000, status: 'IN_PROGRESS', progress: 65, ward: 'All wards', startDate: d(-180), targetDate: d(180), description: 'Functional household tap connections (200 Nos), new borewells, and pipeline extension across Ponthotta Colony and Mela Colony.' },
    { title: 'GPDP: Liquid & Solid Waste Management (SBM-G & 15FC)', category: 'Sanitation', priority: 'HIGH', estimatedCost: 3800000, status: 'IN_PROGRESS', progress: 60, ward: 'All wards', startDate: d(-150), targetDate: d(150), description: 'Greywater management systems, drainage channels at Muthunagar, Vijayapuri Road, Perumal Kovil St, and door-to-door waste collection vehicles.' },
    { title: 'GPDP: Village Road Network & Paver Block Upgrades', category: 'Road', priority: 'HIGH', estimatedCost: 3880000, status: 'APPROVED', progress: 40, ward: 'Ward 1, 2, 3, 5', startDate: d(-90), targetDate: d(210), description: 'CC Road construction and paver block paving at Sanmuga Nagar, North Thittankulam, South Thittankulam, and Mela Colony.' },
    { title: 'GPDP: Public Health, Nutrition & VPRP SDP Mission', category: 'Health', priority: 'HIGH', estimatedCost: 2650000, status: 'APPROVED', progress: 45, ward: 'All wards', startDate: d(-120), targetDate: d(240), description: 'VPRP health interventions, deworming, maternal health, child nutrition, Health Sub-Centre upgrades, and cold-chain equipment.' },
    { title: 'GPDP: School Infrastructure & Institutional Sanitation', category: 'Education', priority: 'MEDIUM', estimatedCost: 1950000, status: 'APPROVED', progress: 35, ward: 'Ward 1, 4', startDate: d(-60), targetDate: d(300), description: 'Panchayat Union Middle School toilet blocks for boys and girls, school furniture, compound walls, and Anganwadi smart facilities.' },
    { title: 'GPDP: Community Facilities, Crematorium & Disaster Resilience', category: 'Infrastructure', priority: 'MEDIUM', estimatedCost: 3600000, status: 'APPROVED', progress: 30, ward: 'All wards', startDate: d(-40), targetDate: d(320), description: 'Panchayat Bhawan extension, community hall upgrades, cyclone shelter, crematorium, CSC co-location, and retaining walls.' },
    { title: 'GPDP: Agriculture, Nutri Gardens & Farm Support', category: 'Agriculture', priority: 'MEDIUM', estimatedCost: 1400000, status: 'APPROVED', progress: 35, ward: 'Ward 6, 9', startDate: d(-30), targetDate: d(180), description: 'Nutri gardens in AWCs and households, grain drying platforms, primary processing support, and haat bazaar.' },
    { title: 'GPDP: Energy Efficiency & Street Lighting Maintenance', category: 'Electricity', priority: 'MEDIUM', estimatedCost: 850000, status: 'IN_PROGRESS', progress: 70, ward: 'All wards', startDate: d(-180), targetDate: d(60), description: 'Maintenance of street lights, LED fixture replacements, and rural electrification across all 9 wards.' },
  ];

  const plans = await M.DevelopmentPlan.insertMany(planDefinitions.map((p) => ({
    ...V, financialYear: fy, createdBy: secretary._id, ...p,
  })));
  console.log(`[seed] Created ${plans.length} GPDP Development Plans`);

  // Helper to map activity category to planId
  const getPlanId = (cat) => {
    const p = plans.find((pl) => pl.category === cat) || plans[0];
    return p._id;
  };

  // ---------- 4. Works (All 116 Real eGramSwaraj Activities) ----------
  const worksToInsert = REAL_ACTIVITIES.map((act, idx) => {
    const isOngoing = act.status === 'IN_PROGRESS';
    const isApproved = act.status === 'APPROVED';
    const assignedUser = act.category === 'Water' ? staff2._id : staff1._id;
    const offset = - (idx * 2 + 5);

    return {
      ...V,
      activityCode: act.code,
      name: act.name,
      description: act.desc,
      workType: act.workType,
      planYear: '2024-2025',
      category: act.category,
      location: act.location,
      planId: getPlanId(act.category),
      scheme: act.scheme,
      estimatedCost: act.estimatedCost,
      approvedAmount: act.approvedAmount || (isApproved || isOngoing ? act.estimatedCost : 0),
      spentAmount: act.spentAmount || 0,
      contractor: isOngoing ? 'Sri Murugan / Thittankulam Village Works' : 'Panchayat Execution',
      startDate: d(offset),
      expectedCompletionDate: d(offset + 180),
      status: act.status,
      progress: act.progress,
      assignedTo: assignedUser,
      createdBy: secretary._id,
      updates: [{
        progress: act.progress,
        status: act.status,
        note: `Official eGramSwaraj activity record [Code: ${act.code}]`,
        by: secretary._id,
        byName: secretary.name,
        at: d(offset),
      }],
    };
  });

  const insertedWorks = await M.Work.insertMany(worksToInsert);
  console.log(`[seed] Inserted ${insertedWorks.length} official Works/Activities`);

  const LOCATION_OFFSETS = [
    { latOff: 0.0005, lngOff: -0.0008 },
    { latOff: 0.0028, lngOff: 0.0012 },
    { latOff: -0.0018, lngOff: 0.0025 },
    { latOff: 0.0015, lngOff: -0.0032 },
  ];
  const assetsToInsert = REAL_ASSETS.map((a, idx) => {
    const loc = LOCATION_OFFSETS[idx % LOCATION_OFFSETS.length];
    const jitterLat = (((idx * 17) % 20 - 10) * 0.00018);
    const jitterLng = (((idx * 31) % 20 - 10) * 0.00018);
    return {
      ...V,
      assetCode: a.assetCode,
      name: a.name,
      planYear: a.planYear || '2022-2023',
      type: a.type,
      category: a.category || a.type,
      subCategory: a.subCategory || a.type,
      location: a.location || 'Thittankulam Village and Panchayat',
      ward: a.ward || 'Ward 2',
      condition: a.condition || 'GOOD',
      ownerDepartment: a.ownerDepartment || 'Panchayat / RD',
      installationDate: d(-1200),
      estimatedValue: a.estimatedValue || 0,
      expenditure: a.expenditure || 0,
      maintenanceDate: d(45),
      maintenanceIntervalDays: 180,
      status: a.status || 'ACTIVE',
      notes: a.notes || 'Official asset recorded in eGramSwaraj asset register.',
      latitude: a.latitude || Number((9.173102 + loc.latOff + jitterLat).toFixed(6)),
      longitude: a.longitude || Number((77.892810 + loc.lngOff + jitterLng).toFixed(6)),
    };
  });

  const insertedAssets = await M.Asset.insertMany(assetsToInsert);
  console.log(`[seed] Inserted ${insertedAssets.length} official Assets`);

  // ---------- 6. Budgets & Financial Transactions ----------
  const prevFy = financialYearOf(new Date(Date.now() - 365 * DAY));
  const budgetLines = [
    ['Roads & Infrastructure', 4500000],
    ['Water Supply', 3500000],
    ['Sanitation', 2500000],
    ['Street Lighting', 850000],
    ['Education', 1500000],
    ['Health', 1800000],
    ['Agriculture', 1200000],
    ['Administration', 800000],
    ['Welfare', 500000],
  ];

  await M.Budget.insertMany([
    ...budgetLines.map(([category, allocatedAmount]) => ({ ...V, financialYear: fy, category, allocatedAmount, source: '15FC & State Finance Grant' })),
    ...budgetLines.map(([category, allocatedAmount]) => ({ ...V, financialYear: prevFy, category, allocatedAmount: Math.round(allocatedAmount * 0.9), source: '15FC & State Finance Grant' })),
  ]);

  const fyStart = new Date(Number(fy.slice(0, 4)), 3, 1);
  const inFy = (days) => { const t = new Date(fyStart.getTime() + days * DAY); return t > new Date() ? new Date(Date.now() - DAY) : t; };
  let ref = 1;
  const tx = (type, category, amount, days, description, status = 'COMPLETED') => ({
    ...V, type, category, amount, date: inFy(days), description: `${description} (Thittankulam LGD: 231907)`, status,
    referenceNumber: `15FC-${type === 'INCOME' ? 'IN' : 'EX'}-${String(ref++).padStart(4, '0')}`, createdBy: admin._id,
  });

  await M.FinancialTransaction.insertMany([
    tx('INCOME', 'Central Finance Commission Grant', 4500000, 15, '15FC Devolution & Tied Grant for Water & Sanitation'),
    tx('INCOME', 'State Finance Commission Grant', 3200000, 30, 'SFC Basic Grant for Infrastructure & Road Works'),
    tx('INCOME', 'House Tax', 285000, 45, 'House tax collection – Q1'),
    tx('INCOME', 'Water Charges', 145000, 60, 'Water supply charges – Q1'),
    tx('INCOME', 'MGNREGS', 950000, 75, 'MGNREGS convergence material component'),
    tx('INCOME', 'Scheme Funds', 1500000, 90, 'JJM Piped Water Supply Fund Release'),
    tx('INCOME', 'House Tax', 210000, 130, 'House tax collection – Q2'),
    tx('EXPENSE', 'Water Supply', 1370000, 40, 'Ponthotta Colony Piped Water & 200 Tap Connections [Act: 86707397]'),
    tx('EXPENSE', 'Sanitation', 240000, 50, 'Muthunagar Greywater drainage 120m [Act: 86707205]'),
    tx('EXPENSE', 'Sanitation', 242000, 65, 'South Thittankulam Vijayapuri Rd drainage 125m [Act: 86707244]'),
    tx('EXPENSE', 'Sanitation', 294000, 80, 'North Thittankulam Perumal Kovil St drainage 115m [Act: 86707305]'),
    tx('EXPENSE', 'Sanitation', 225000, 95, 'Waste Collection Tractor and Trailer [Act: 86707146]'),
    tx('EXPENSE', 'Sanitation', 116500, 105, 'Purchase of 2 Nos E-Cart Vehicles [Act: 86707866]'),
    tx('EXPENSE', 'Infrastructure', 2224150, 25, 'Infrastructure Delivery & TWAD / TNEB Payment Settled [Act: 108356889]'),
    tx('EXPENSE', 'Infrastructure', 88000, 35, 'Panchayat Computer, UPS & Printer [Act: 86707513]'),
    tx('EXPENSE', 'Roads & Infrastructure', 312000, 110, 'Sanmuga Nagar Paver Block Road 195m [Act: 93814475]'),
    tx('EXPENSE', 'Roads & Infrastructure', 292500, 120, 'North Thittankulam CC Road Society to Sankarapandi [Act: 93814943]'),
    tx('EXPENSE', 'Roads & Infrastructure', 240000, 135, 'South Thittankulam Mela Colony CC Road [Act: 93816707]'),
    tx('EXPENSE', 'Health', 420000, 85, 'Health Sub-Centre Construction & Equipments [Act: 79001041]'),
    tx('EXPENSE', 'Education', 152000, 140, 'Panchayat Union Middle School Compound Wall [Act: 93819547]'),
    tx('EXPENSE', 'Street Lighting', 72000, 115, 'Street Light Maintenance across all 9 Wards [Act: 93847486]'),
    tx('EXPENSE', 'Administration', 180000, 50, 'Office establishment & stationery'),
    tx('EXPENSE', 'Health', 712500, 145, 'Procurement of Ambulance for Primary Health [Act: 93847903]'),
  ]);
  await recalcAll(vid);

  // ---------- 7. Meetings (Gram Sabha & Panchayat Meetings) ----------
  await M.Meeting.insertMany([
    {
      title: 'Gram Sabha – Independence Day & GPDP Plan Review',
      type: 'GRAM_SABHA',
      date: d(-38, 11),
      location: 'Community Hall, Thittankulam',
      status: 'COMPLETED',
      agenda: [
        'Review of 15th Finance Commission works',
        'Jal Jeevan Mission Tap Connections (Ponthotta Colony)',
        'Solid and Liquid Waste Management (E-Carts & Drainage)',
        'VPRP SDP Health and Nutrition plans',
      ],
      minutes: 'Gram Sabha held at Thittankulam Community Hall with participation of 350+ residents and ward members. Secretary Ramesh presented the 15FC work progress. Resolved to expedite tap connections at Ponthotta Colony and drainage at Vijayapuri Road.',
      decisions: [
        'Complete Ponthotta Colony 200 household tap connections by next month',
        'Approve greywater drainage channel at Muthunagar and Perumal Kovil St',
        'Procure 2 E-Carts for door-to-door waste collection',
      ],
      attendance: { total: 365, male: 175, female: 190, officials: ['Ramesh (Panchayat Secretary)', 'R. Selvam (Overseer)', 'P. Karthik (Operator)'] },
    },
    {
      title: 'Gram Sabha – Gandhi Jayanti (Social Audit & GPDP)',
      type: 'GRAM_SABHA',
      date: d(4, 11),
      location: 'Community Hall, Thittankulam',
      status: 'SCHEDULED',
      agenda: [
        'Social Audit of 15FC & MGNREGS works (Audit Team: 15FC 2024-2025)',
        'Water supply OHT tank status at South Thittankulam & North Thittankulam',
        'School infrastructure & boys/girls toilet construction',
        'Redressal of citizen grievances',
      ],
    },
    {
      title: 'Panchayat Council Monthly Review Meeting',
      type: 'PANCHAYAT_MEETING',
      date: d(-12, 15),
      location: 'Panchayat Office, Thittankulam',
      status: 'COMPLETED',
      agenda: ['15FC audit observation settlement', 'Drainage works progress at Sanmuga Nagar', 'Street light maintenance tender'],
      minutes: 'Reviewed progress of all ongoing activities. Directed contractor to finish CC road at North Thittankulam before monsoon.',
      attendance: { total: 9, male: 5, female: 4, officials: ['Ward Members (Wards 1-9)', 'Ramesh (Secretary)'] },
    },
  ].map((m) => ({ ...V, isPublic: true, createdBy: secretary._id, ...m })));

  // ---------- 8. Announcements ----------
  await M.Announcement.insertMany([
    {
      title: 'Gram Sabha Meeting on 2 October at Community Hall',
      category: 'GRAM_SABHA',
      pinned: true,
      publishDate: d(-2),
      expiryDate: d(10),
      description: 'All citizens of Wards 1–9 of Thittankulam Panchayat are cordially invited to attend the Gram Sabha meeting at 11:00 AM in the Community Hall. Agenda: 15FC Social Audit, JJM Piped Water, and Sanitation.',
    },
    {
      title: 'Functional Household Tap Connection (JJM) – Ponthotta Colony',
      category: 'DEVELOPMENT_UPDATE',
      publishDate: d(-5),
      description: '200 Functional Household Tap Connections and 1500m pipeline extension work in Ponthotta Colony is 80% complete under Jal Jeevan Mission.',
    },
    {
      title: 'Door-to-Door Waste Collection with New E-Carts',
      category: 'PUBLIC_INFORMATION',
      publishDate: d(-7),
      description: 'Door-to-door segregated waste collection has commenced across all wards with newly procured battery-operated E-Cart vehicles.',
    },
    {
      title: 'Health & Anaemia Screening Camp at Health Sub-Centre',
      category: 'EVENT',
      publishDate: d(-3),
      expiryDate: d(8),
      description: 'Special health camp for adolescent healthcare, anaemia screening, and free blood testing will be held this Saturday at the Health Sub-Centre.',
    },
    {
      title: 'House Tax & Water Charges Collection',
      category: 'GOVERNMENT_NOTICE',
      publishDate: d(-10),
      description: 'Residents are requested to remit their half-yearly house tax and water charges at the Panchayat Office CSC counter.',
    },
  ].map((a) => ({ ...V, status: 'PUBLISHED', notified: true, createdBy: secretary._id, ...a })));
  // ---------- 9. Grievances ----------
  const year = new Date().getFullYear();
  const cKey = `grievance-${vid}-${year}`;
  const gv = [
    { c: 0, category: 'Water Supply', subject: 'Water supply pipeline leakage near Ponthotta Colony', description: 'Pipeline connection has minor leakage near the main road junction.', location: 'Ponthotta Colony, Ward 1', ward: 'Ward 1', priority: 'HIGH', status: 'IN_PROGRESS', assignedTo: staff2._id, ago: 6 },
    { c: 1, category: 'Drainage', subject: 'Drain clearing needed at Palpannai Street', description: 'Greywater drain requires desilting after heavy shower.', location: 'Palpannai Street, Ward 2', ward: 'Ward 2', priority: 'HIGH', status: 'RESOLVED', assignedTo: staff1._id, resolution: 'Desilting completed and water flow restored.', ago: 15, res: 12 },
    { c: 2, category: 'Street Lights', subject: 'Street light repair on Muthunagar Main Street', description: 'Two LED street lights not turning on near the transformer pole.', location: 'Muthunagar Main Street', ward: 'Ward 3', priority: 'MEDIUM', status: 'RESOLVED', assignedTo: staff1._id, resolution: 'Replaced faulty choke and lamps.', ago: 22, res: 19 },
    { c: 3, category: 'Sanitation', subject: 'Request for E-Cart waste collection in School Street', description: 'Kindly ensure the E-Cart vehicle visits School Street in the morning schedule.', location: 'School Street, Ward 4', ward: 'Ward 4', priority: 'MEDIUM', status: 'ACKNOWLEDGED', assignedTo: staff1._id, ago: 3 },
    { c: 4, category: 'Roads', subject: 'Paver block leveling near Mandapa Street', description: 'Some paver blocks near the wedding hall corner need leveling.', location: 'Sanmuga Nagar, Ward 8', ward: 'Ward 8', priority: 'LOW', status: 'SUBMITTED', ago: 1 },
  ];

  for (const g of gv) {
    const seq = await M.Counter.next(cKey);
    const created = d(-g.ago, 9);
    const citizen = citizens[g.c];
    const history = [{ status: 'SUBMITTED', action: 'Submitted', byName: citizen.name, at: created }];
    if (g.assignedTo || g.status !== 'SUBMITTED') history.push({ status: 'ACKNOWLEDGED', action: 'Acknowledged & assigned', byName: secretary.name, at: new Date(created.getTime() + DAY) });
    if (['IN_PROGRESS', 'RESOLVED'].includes(g.status)) history.push({ status: 'IN_PROGRESS', action: 'Work in progress', byName: secretary.name, at: new Date(created.getTime() + 2 * DAY) });
    if (['RESOLVED', 'REJECTED'].includes(g.status)) history.push({ status: g.status, action: `Status changed to ${g.status}`, note: g.resolution, byName: secretary.name, at: d(-g.res) });

    await M.Grievance.create({
      ...V,
      referenceNumber: `${village.villageCode}-GRV-${year}-${String(seq).padStart(4, '0')}`,
      citizenId: citizen._id,
      submittedBy: citizen.userId || null,
      category: g.category,
      subject: g.subject,
      description: g.description,
      location: g.location,
      ward: g.ward,
      priority: g.priority,
      status: g.status,
      assignedTo: g.assignedTo || null,
      resolution: g.resolution,
      history,
      acknowledgedAt: g.status !== 'SUBMITTED' ? new Date(created.getTime() + DAY) : undefined,
      resolvedAt: g.res ? d(-g.res) : undefined,
      createdAt: created,
    });
  }

  // ---------- 10. Notifications ----------
  const allUsers = await M.User.find({ villageId: vid });
  await M.Notification.insertMany(allUsers.map((u) => ({
    ...V, userId: u._id, type: 'SYSTEM', title: 'Welcome to E-GramSwaraj+ Thittankulam',
    message: 'Official digital governance platform for Thittankulam Village Panchayat (LGD: 231907).', link: '/',
  })));

  const counts = {};
  for (const name of ['Citizen', 'DevelopmentPlan', 'Work', 'Asset', 'Budget', 'FinancialTransaction', 'Meeting', 'Announcement', 'Grievance', 'Notification', 'User']) {
    counts[name] = await M[name].countDocuments({ villageId: vid });
  }
  console.table(counts);
  console.log(`\n[seed] Successfully populated official eGramSwaraj data! All records reference villageId ${vid}.`);
  console.log('[seed] Official Logins:');
  console.log('       Admin: admin@stk.gov.demo / Admin@123');
  console.log('       Secretary: tutkpti.tnbdo@gmail.com / Officer@123 (or officer@stk.gov.demo / Officer@123)');
  console.log('       Staff: staff@stk.gov.demo / Staff@123');
  console.log('       Citizen: citizen@stk.gov.demo / Citizen@123\n');
}

seed()
  .catch((e) => { console.error('[seed] Failed:', e); process.exitCode = 1; })
  .finally(() => sequelize.close());
