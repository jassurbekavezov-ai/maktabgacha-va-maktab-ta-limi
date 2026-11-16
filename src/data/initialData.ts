import { NewsItem, Organization, Leader, DocumentItem, CitizenAppeal, PortalSettings } from '../types';
import { heroImage, headPortrait, preschoolBuilding, conferenceImage } from '../assets/images';

export const INITIAL_SETTINGS: PortalSettings = {
  districtName: "Qo'shko'pir tumani ta'lim bo'limi",
  shortName: "Qo'shko'pir ta'lim bo'limi",
  supervisingOrg: "O'zbekiston Respublikasi Ta'lim tizimi",
  regionLabel: "Xorazm viloyati",
  portalSubtitle: "Rasmiy axborot va elektron xizmatlar portali",
  departmentPhone: "+998 (62) 352-14-25",
  trustPhone: "+998 (55) 605-50-93",
  email: "info@talim-tashkiloti.uz",
  address: "Xorazm viloyati, Qo'shko'pir, Mustaqillik ko'chasi, 24-uy",
  workingHours: "Dushanba - Juma: 09:00 - 18:00 (Tushlik: 13:00 - 14:00)",
  workingHoursShort: "Ish vaqti: Dush-Juma 09:00 - 18:00",
  telegramChannel: "https://t.me/talim_tashkiloti",
  facebookPage: "https://facebook.com/talim.tashkiloti",
  youtubeChannel: "https://youtube.com/@talim_tashkiloti",
  schoolsCount: 54,
  mttsCount: 42,
  studentsTotal: 34850,
  teachersTotal: 2840,
  specializedSchoolsCount: 4,
  higherCategoryTeachersCount: 685,
  marqueeText: "E'lon: 2026-yilgi umumta'lim maktablarining 1-sinfiga qabul jarayonlari boshlandi! Barcha savollar bo'yicha Ishonch telefoniga murojaat qilishingiz mumkin: +998 (62) 352-11-02.",
  navLabels: {
    home: "Asosiy",
    about: "Tashkilot haqida",
    orgs: "Muassasalar",
    docs: "Hujjatlar",
    news: "Yangiliklar",
    reception: "Virtual qabulxona",
    contact: "Aloqa"
  },

  // Asosiy sahifa sozlamalari
  heroTitle: "Ta'lim va tarbiya — kelajak poydevori, ma'rifatli avlod kafolati",
  heroSubtitle: "Ta'lim tashkiloti tizimidagi ta'lim muassasalari, pedagogik jamoa va zamonaviy raqamli xizmatlar faoliyatini yagona ochiq platforma orqali kuzatib boring.",
  heroBadgeText: "Xorazm viloyati · Ta'lim tashkiloti",
  heroImageUrl: "./assets/aistudio/IMG_20261114_101244_271_9b96aa41.jpg",
  heroPrimaryBtnText: "Murojaat yo'llash",
  heroSecondaryBtnText: "Muassasalar katalogi",
  heroShowcaseBadge: "Zamonaviy ta'lim maskani",
  heroShowcaseTitle: "Innovatsion o'quv majmuasi va raqamli sinfxonalar",
  heroShowcaseDesc: "STEM laboratoriyalari, zamonaviy kutubxona va sport inshootlariga ega qulay ta'lim muhiti",
  heroServicesTitle: "Elektron ta'lim xizmatlari va havolalar",
  heroServicesSubtitle: "Yagona raqamli axborot tizimlari",
  quickServices: [
    {
      id: "srv-1",
      title: "Qabul jarayoni",
      desc: "Ta'lim tashkilotiga elektron ariza topshirish",
      link: "https://adm.edu.uz",
      isExternal: true,
      color: "bg-blue-600 text-white"
    },
    {
      id: "srv-2",
      title: "Davlat xizmatlari",
      desc: "Elektron navbat va hujjatlarni tekshirish",
      link: "https://my.gov.uz",
      isExternal: true,
      color: "bg-emerald-600 text-white"
    },
    {
      id: "srv-3",
      title: "Pedagoglar attestatsiyasi",
      desc: "Malaka toifasi sinovlari va natijalari",
      link: "https://pedkadr.uzedu.uz",
      isExternal: true,
      color: "bg-amber-600 text-white"
    },
    {
      id: "srv-4",
      title: "Fan olimpiadalari",
      desc: "Bellashuv va tanlovlar natijalari",
      link: "#yangiliklar",
      isExternal: false,
      color: "bg-indigo-600 text-white"
    },
    {
      id: "srv-5",
      title: "Elektron kundalik",
      desc: "eMaktab yagona ta'lim axborot tizimi",
      link: "https://emaktab.uz",
      isExternal: true,
      color: "bg-rose-600 text-white"
    },
    {
      id: "srv-6",
      title: "Virtual qabulxona",
      desc: "Tashkilot rahbariyatiga to'g'ridan-to'g'ri murojaat",
      link: "#murojaat",
      isExternal: false,
      color: "bg-sky-700 text-white"
    }
  ],

  // Statistika bo'limi
  statsKicker: "Raqamlarda ta'lim tashkiloti",
  statsTitle: "Ta'lim tashkiloti faoliyatining asosiy ko'rsatkichlari",
  statsItems: [
    {
      id: "st-1",
      label: "Umumta'lim maktablari",
      value: "54",
      suffix: " ta",
      sub: "Hududdagi muassasalar",
      icon: "school",
      color: "text-blue-600 bg-blue-50"
    },
    {
      id: "st-2",
      label: "Maktabgacha tashkilotlar",
      value: "42",
      suffix: " ta",
      sub: "Davlat va nodavlat maskanlar",
      icon: "baby",
      color: "text-emerald-600 bg-emerald-50"
    },
    {
      id: "st-3",
      label: "O'quvchi yoshlar",
      value: "34 850",
      suffix: "+",
      sub: "Barcha bosqich ta'lim oluvchilari",
      icon: "graduation",
      color: "text-purple-600 bg-purple-50"
    },
    {
      id: "st-4",
      label: "Pedagog xodimlar",
      value: "2 840",
      suffix: "+",
      sub: "Tajribali ustozlar jamoasi",
      icon: "users",
      color: "text-amber-600 bg-amber-50"
    },
    {
      id: "st-5",
      label: "Oliy toifali ustozlar",
      value: "685",
      suffix: "+",
      sub: "Malaka toifasiga ega pedagoglar",
      icon: "book",
      color: "text-teal-600 bg-teal-50"
    },
    {
      id: "st-6",
      label: "Olimpiada g'oliblari",
      value: "142",
      suffix: "+",
      sub: "2026-yilgi fan bellashuvlari",
      icon: "award",
      color: "text-rose-600 bg-rose-50"
    }
  ],

  // Tashkilot haqida (#bolim-haqida - Admin orqali to'liq boshqariladi)
  aboutKicker: "Tashkilot faoliyati",
  aboutTitle: "Ta'lim tashkiloti haqida ma'lumot",
  aboutTabLeadersLabel: "Tashkilot rahbariyati",
  aboutTabStructureLabel: "Tashkiliy tuzilma va bo'limlar",
  aboutTabTasksLabel: "Asosiy vazifa va funksiyalar",
  aboutTabHistoryLabel: "Tashkilot tarixi va me'yoriy asos",
  aboutStructureNote: "Tashkilotning ichki tuzilmasi, bo'linmalari va ularning rahbarlari to'liq Admin panel va Google Sheets bazasi orqali boshqariladi hamda tahrirlanadi.",
  aboutHeadRoleLabel: "Bo'linma rahbari",
  aboutTasksTitle: "Tashkilotning nizom bilan belgilangan asosiy vazifalari",
  aboutHistoryTitle: "Tarixiy ma'lumot va rivojlanish bosqichlari",
  aboutCharterLabel: "Me'yoriy huquqiy asos",
  departmentHistory: "Ta'lim tashkiloti o'z faoliyatini ilg'or milliy va xalqaro ta'lim standartlari asosida yo'lga qo'ygan bo'lib, ko'p yillar davomida bilimli, raqobatbardosh va ma'rifatli yosh avlodni tarbiyalab kelmoqda. Bugungi kunda zamonaviy raqamli boshqaruv va ochiqlik tamoyillari asosida barcha ta'lim yo'nalishlari yagona tizim sifatida faoliyat yuritmoqda.",
  departmentMission: "Har bir ta'lim oluvchiga teng, sifatli va zamonaviy ta'lim-tarbiya olish imkoniyatini yaratish, pedagoglarning kasbiy salohiyatini rivojlantirish hamda zamonaviy axborot texnologiyalarini ta'lim jarayoniga keng tatbiq etish.",
  departmentCharter: "Tashkilot O'zbekiston Respublikasi Konstitutsiyasi, 'Ta'lim to'g'risida'gi Qonun, amaldagi davlat ta'lim standartlari hamda tashkilot Nizomi asosida ish yuritadi.",
  tasksList: [
    "Ta'lim jarayonida davlat ta'lim standartlari va ilg'or o'quv dasturlarini to'liq ta'minlash",
    "Maktabgacha va umumiy ta'lim bosqichlarida sifatli parvarish hamda uzviy ta'lim-tarbiyani yo'lga qo'yish",
    "Iqtidorli o'quvchilarni aniqlash, ularni fan olimpiadalari va ijodiy tanlovlarga tayyorlash",
    "Pedagog kadrlar malakasini muntazam oshirish va zamonaviy o'qitish metodikalarini joriy etish",
    "Ta'lim muassasalari moddiy-texnik bazasi va raqamli infratuzilmasini mustahkamlash",
    "Ota-onalar, fuqarolar va jamoatchilik bilan ochiq muloqot hamda hamkorlikni rivojlantirish"
  ],
  branches: [
    {
      id: "br-1",
      name: "O'quv-metodik ta'minot va sifat nazorati bo'limi",
      head: "Matyoqubov Shuxratbek Qadamovich",
      phone: "+998 (62) 352-16-40",
      staffCount: 6,
      description: "Ta'lim jarayonini metodik muvofiqlashtirish, o'quv dasturlari ijrosi va bilim sifatini monitoring qilish."
    },
    {
      id: "br-2",
      name: "Maktabgacha va boshlang'ich tayyorlov yo'nalishi",
      head: "Sobirova Gulchehra Karimovna",
      phone: "+998 (62) 352-18-12",
      staffCount: 5,
      description: "Ilk rivojlanish dasturlari, bolalarni maktabga sifatli tayyorlash va pedagogik ko'mak ko'rsatish."
    },
    {
      id: "br-3",
      name: "Innovatsiyalar, PISA va xalqaro baholash markazi",
      head: "Qutlimuratov Anvar Omonovich",
      phone: "+998 (62) 352-15-77",
      staffCount: 8,
      description: "O'qituvchilar uchun seminar-treninglar, raqamli texnologiyalar va xalqaro baholash dasturlariga tayyorgarlik."
    },
    {
      id: "br-4",
      name: "Moliya-iqtisodiyot va moddiy-texnik ta'minot bo'limi",
      head: "Bekchanov Mansurbek Shokirovich",
      phone: "+998 (62) 352-12-30",
      staffCount: 4,
      description: "Tashkilotni moliyalashtirish, moddiy-texnik ta'minot va infratuzilmani rivojlantirish masalalari."
    },
    {
      id: "br-5",
      name: "Inson resurslari va kadrlar bilan ishlash bo'limi",
      head: "Ro'zimov Ilhom Qodirovich",
      phone: "+998 (62) 352-19-15",
      staffCount: 3,
      description: "Pedagog va mutaxassis kadrlar hisobi, attestatsiya jarayonlari va bo'sh ish o'rinlari."
    }
  ],

  // Muassasalar / Bo'linmalar bo'limi
  orgsKicker: "Ta'lim muassasalari tarmog'i",
  orgsTitle: "Ta'lim muassasalari va bo'linmalar katalogi",
  orgsSubtitle: "Tashkilot tizimidagi barcha muassasalar ma'lumotlari, manzillari va mas'ul rahbarlari",
  orgsFilterAllLabel: "Barchasi",
  orgsFilterSchoolLabel: "Maktablar",
  orgsFilterKindergartenLabel: "Bog'chalar - MTT",
  orgsFilterSpecializedLabel: "Ixtisoslashgan",

  // Hujjatlar bo'limi
  docsKicker: "Me'yoriy baza",
  docsTitle: "Me'yoriy-huquqiy hujjatlar va buyruqlar",
  docsSubtitle: "Tashkilot nizomlari, ichki buyruqlar, o'quv dasturlari va rasmiy qarorlar",
  docCategories: [
    "Tashkilot buyruqlari",
    "Vazirlik buyruqlari",
    "Hokim qarorlari",
    "Nizom va qoidalar",
    "O'quv dasturlari"
  ],

  // Yangiliklar bo'limi
  newsKicker: "Axborot xizmati",
  newsTitle: "Yangiliklar va rasmiy xabarlar",
  newsSubtitle: "Ta'lim tashkiloti hayotidagi muhim voqealar, tadbirlar va rasmiy e'lonlar",
  newsCategories: [
    "Boshqaruv",
    "MTT",
    "Pedagogika",
    "Olimpiada",
    "Tadbirlar",
    "E'lon"
  ],

  // Virtual qabulxona
  receptionKicker: "Fuqarolar bilan muloqot",
  receptionTitle: "Rahbariyat virtual qabulxonasi",
  receptionSubtitle: "Ta'lim tashkiloti rahbariyatiga to'g'ridan-to'g'ri elektron murojaat yo'llang va ijro holatini kuzating",
  receptionTargets: [
    "Ta'lim tashkiloti rahbariyati",
    "O'quv-metodik bo'lim",
    "Maktabgacha va boshlang'ich yo'nalish",
    "Kadrlar va qabul bo'limi"
  ],

  // Aloqa va xarita
  contactKicker: "Bog'lanish",
  contactTitle: "Ta'lim tashkiloti bilan aloqa",
  contactSubtitle: "Manzilimiz, qabulxona telefonlari va ijtimoiy tarmoqlardagi rasmiy sahifalarimiz",
  contactAddressLabel: "Tashkilot manzili:",
  landmarkText: "Mo'ljal: Markaziy maydon va axborot-resurs markazi yaqinida",
  mapAreaTitle: "Tashkilot joylashuvi",
  mapAreaDesc: "Tashkilot bosh binosi Mustaqillik ko'chasida, markaziy istirohat bog'i ro'parasida joylashgan.",
  mapTransportLabel: "Jamoat transporti:",
  mapTransportText: "Shahar va tuman markaziy yo'nalishli avtobuslari (\"Markaz\" bekati)",
  mapExternalUrl: "https://yandex.uz/maps",

  // Footer
  footerDisclaimer: "Saytdan olingan barcha axborotlardan foydalanilganda Ta'lim tashkiloti rasmiy veb-saytiga havola berilishi shart.",
  footerCopyright: "Ta'lim tashkiloti. Barcha huquqlar himoyalangan.",
  governmentLinks: [
    { id: "gl-1", title: "O'zbekiston Respublikasi Prezidenti", url: "https://president.uz" },
    { id: "gl-2", title: "Hukumat portali (gov.uz)", url: "https://gov.uz" },
    { id: "gl-3", title: "Ta'lim tizimi rasmiy portali", url: "https://gov.uz/oz/edu" },
    { id: "gl-4", title: "Yagona interaktiv davlat xizmatlari (my.gov.uz)", url: "https://my.gov.uz" },
    { id: "gl-5", title: "Ta'lim sifatini nazorat qilish inspeksiyasi", url: "https://tdi.uz" },
    { id: "gl-6", title: "Xorazm viloyati hokimligi", url: "https://xorazm.uz" }
  ],

  // Gmail bilan admin panelga kirish ruxsati berilgan hisoblar
  allowedAdminEmails: [
    "burgutsony@gmail.com"
  ],

  // Telegram, Facebook va Instagram ijtimoiy tarmoqlariga avtomatik yuborish sozlamalari
  telegramBotToken: "",
  telegramChannelUsername: "@talim_tashkiloti",
  telegramAutoPublish: true,
  facebookPageId: "",
  facebookPageToken: "",
  facebookAutoPublish: false,
  instagramPage: "https://instagram.com/talim_tashkiloti",
  instagramAccountId: "",
  instagramAccessToken: "",
  instagramAutoPublish: false
};

export const INITIAL_LEADERS: Leader[] = [
  {
    id: "lead-1",
    name: "Raximov Mansur Davlatovich",
    position: "Tashkilot direktori",
    department: "Qo'shko'pir Ta'lim Tashkiloti",
    phone: "+998 (62) 352-14-25",
    email: "m.raximov@talim-tashkiloti.uz",
    receptionDays: "Har haftaning chorshanba va juma kunlari",
    receptionHours: "10:00 - 12:00",
    bio: "Pedagogika fanlari bo'yicha falsafa doktori (PhD). Ta'lim sohasida 22 yildan ortiq tajribaga ega. Ta'lim jarayonini raqamlashtirish va innovatsion metodikalarni joriy etish tashabbuskori.",
    photoUrl: headPortrait,
    order: 1
  },
  {
    id: "lead-2",
    name: "Matyoqubov Shuxratbek Qadamovich",
    position: "Direktor o'rinbosari — O'quv-metodik bo'lim boshlig'i",
    department: "O'quv-metodik yo'nalish",
    phone: "+998 (62) 352-16-40",
    email: "sh.matyoqubov@talim-tashkiloti.uz",
    receptionDays: "Har haftaning seshanba va payshanba kunlari",
    receptionHours: "14:00 - 17:00",
    bio: "Oliy toifali matematika fani o'qituvchisi. Aniq fanlarni chuqurlashtirib o'qitish va olimpiada markazlarini rivojlantirish bo'yicha mas'ul rahbar.",
    photoUrl: headPortrait,
    order: 2
  },
  {
    id: "lead-3",
    name: "Sobirova Gulchehra Karimovna",
    position: "Maktabgacha va boshlang'ich tayyorlov bo'limi rahbari",
    department: "Tayyorlov yo'nalishi",
    phone: "+998 (62) 352-18-12",
    email: "g.sobirova@talim-tashkiloti.uz",
    receptionDays: "Har haftaning dushanba va chorshanba kunlari",
    receptionHours: "09:00 - 12:00",
    bio: "Ta'lim sohasi a'lochisi. Zamonaviy ilk rivojlanish dasturlari va 'Ilk qadam' metodikasini joriy etish bo'yicha yetakchi mutaxassis.",
    photoUrl: headPortrait,
    order: 3
  }
];

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: "news-1",
    title: "Yangi innovatsion o'quv majmuasi foydalanishga topshirildi",
    category: "Boshqaruv",
    date: "2026-11-08",
    summary: "660 o'ringa mo'ljallangan zamonaviy 14-sonli ta'lim muassasasining yangi o'quv korpusi tantanali ravishda ochildi.",
    content: "Ta'lim sifatini oshirish va zamonaviy infratuzilmani yaxshilash dasturi doirasida navbatdagi zamonaviy o'quv korpusi qad rostladi. Yangi binoda eng so'nggi rusumdagi STEM laboratoriyalari, interaktiv multimedia sinfxonalari, keng sport zali va zamonaviy kutubxona mavjud. Ochilish marosimida tashkilot rahbariyati, pedagoglar jamoasi, nuroniylar hamda ota-onalar ishtirok etishdi.",
    imageUrl: heroImage,
    author: "Matbuot xizmati",
    views: 1240,
    isPinned: true
  },
  {
    id: "news-2",
    title: "Maktabgacha ta'lim maskanlarida zamonaviy 'Ilk qadam' dasturi takomillashtirilmoqda",
    category: "MTT",
    date: "2026-11-05",
    summary: "Maktabgacha yoshdagi bolalarni sifatli ta'lim bilan qamrab olish va maktabga tayyorlash bo'yicha seminar-trening o'tkazildi.",
    content: "Tashkilotning metodika bo'limi tashabbusi bilan 5-sonli 'Mitti Qadamlar' ta'lim maskanida seminar-trening tashkil etildi. Treningda tarbiyachilar yangi interaktiv didaktik o'yinlar, bolalarni maktabga tayyorlashning zamonaviy metodikalari hamda sensor rivojlanish vositalarini amaliyotda qo'llash ko'nikmalarini mustahkamladilar.",
    imageUrl: preschoolBuilding,
    author: "Metodika bo'limi",
    views: 890,
    isPinned: true
  },
  {
    id: "news-3",
    title: "Pedagoglar forumi: Xalqaro baholash PISA va TIMSS mezonlariga tayyorgarlik masalalari muhokama qilindi",
    category: "Pedagogika",
    date: "2026-10-29",
    summary: "500 dan ortiq yetakchi fan o'qituvchilari ishtirokida ilmiy-amaliy anjuman bo'lib o'tdi.",
    content: "O'quvchilarning mantiqiy, tanqidiy fikrlashini o'stirish, fanlararo integratsiyani ta'minlash va yangi darsliklar bilan ishlash bo'yicha mahorat darslari o'tkazildi. Forum yakunida yuqori natijalarga erishgan 25 nafar fidoiy o'qituvchi tashkilotning faxriy yorliqlari va esdalik sovg'alari bilan taqdirlandi.",
    imageUrl: conferenceImage,
    author: "O'quv-metodik markaz",
    views: 645,
    isPinned: false
  },
  {
    id: "news-4",
    title: "Asosiy fan olimpiadasining saralash bosqichida 142 nafar iqtidorli o'quvchi g'oliblikni qo'lga kiritdi",
    category: "Olimpiada",
    date: "2026-10-21",
    summary: "Matematika, fizika, kimyo va xorijiy tillar yo'nalishlarida yoshlar yuqori bilim saviyasini namoyon qildilar.",
    content: "G'olib o'quvchilar endi keyingi bosqichda tashkilot sharafini himoya qiladilar. Eng yuqori natijani 1-sonli ixtisoslashtirilgan maktab-internati hamda 14-sonli umumiy o'rta ta'lim maktabi o'quvchilari qayd etishdi.",
    imageUrl: heroImage,
    author: "Iqtidorli yoshlar bo'limi",
    views: 780,
    isPinned: false
  }
];

export const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: "mtt-12",
    type: "mtt",
    number: 12,
    name: "12-sonli 'Kamalak' davlat maktabgacha ta'lim tashkiloti",
    address: "G'azovot qishlog'i",
    mahalla: "G'azovot mahallasi",
    director: "Ibragimova Nodira Qodirovna",
    phone: "+998 (62) 352-18-12",
    email: "mtt12@talim-tashkiloti.uz",
    studentsCount: 190,
    teachersCount: 22,
    shifts: 1,
    establishedYear: 2020,
    rating: 4.7,
    photoUrl: preschoolBuilding,
    description: "Bolalarni har tomonlama rivojlantirish va maktabga sifatli tayyorlash maskani"
  },
  {
    id: "org-1",
    type: "maktab",
    number: 1,
    name: "1-son umumta'lim maktabi",
    address: "Markaziy ko'cha, 10-uy",
    mahalla: "Markaz",
    director: "Avezov Furqatbek",
    phone: "+998 (62) 352-19-02",
    email: "maktab1@talim-tashkiloti.uz",
    studentsCount: 350,
    teachersCount: 45,
    shifts: 1,
    establishedYear: 1990,
    rating: 4.5,
    photoUrl: heroImage,
    description: "Zamonaviy o'quv jihozlari va chet tillariga ixtisoslashgan sinflar"
  },
  {
    id: "sch-1",
    type: "ixtisos",
    number: 1,
    name: "1-sonli aniq va tabiiy fanlarga ixtisoslashtirilgan maktab-internati",
    address: "Al-Xorazmiy ko'chasi, 12-uy",
    mahalla: "Navro'z mahallasi",
    director: "Otaxonov Bobur Karimovich",
    phone: "+998 (62) 352-21-14",
    email: "ixtisos1@talim-tashkiloti.uz",
    studentsCount: 780,
    teachersCount: 74,
    shifts: 1,
    establishedYear: 1998,
    rating: 4.9,
    photoUrl: heroImage,
    description: "Matematika, fizika va biologiya fanlariga chuqurlashtirilgan tayanch maskan"
  },
  {
    id: "sch-14",
    type: "maktab",
    number: 14,
    name: "14-sonli umumiy o'rta ta'lim maktabi",
    address: "Shixmashhad qishlog'i",
    mahalla: "Shixmashhad mahallasi",
    director: "Yusupova Dilnoza Anvarovna",
    phone: "+998 (62) 352-33-88",
    email: "maktab14@talim-tashkiloti.uz",
    studentsCount: 940,
    teachersCount: 68,
    shifts: 2,
    establishedYear: 1982,
    rating: 4.8,
    photoUrl: heroImage,
    description: "STEM laboratoriyalari va sport majmuasiga ega namunaviy maktab"
  },
  {
    id: "sch-2",
    type: "maktab",
    number: 2,
    name: "2-sonli umumiy o'rta ta'lim maktabi",
    address: "Mustaqillik shoh ko'chasi, 45-uy",
    mahalla: "Markaz mahallasi",
    director: "Qalandarov Umidjon Sultonovich",
    phone: "+998 (62) 352-19-02",
    email: "maktab2@talim-tashkiloti.uz",
    studentsCount: 1120,
    teachersCount: 85,
    shifts: 2,
    establishedYear: 1975,
    rating: 4.7,
    photoUrl: heroImage,
    description: "Axborot texnologiyalari va robototexnika to'garaklari faoliyat yuritadi"
  },
  {
    id: "sch-23",
    type: "maktab",
    number: 23,
    name: "23-sonli umumiy o'rta ta'lim maktabi",
    address: "Xonobod qishlog'i",
    mahalla: "Xonobod mahallasi",
    director: "Matrasulov Otabek Baxtiyorovich",
    phone: "+998 (62) 352-44-12",
    email: "maktab23@talim-tashkiloti.uz",
    studentsCount: 620,
    teachersCount: 48,
    shifts: 2,
    establishedYear: 1990,
    rating: 4.6,
    photoUrl: heroImage,
    description: "Zamonaviy kutubxona va xorijiy tillar xonasiga ega ta'lim muassasasi"
  },
  {
    id: "mtt-5",
    type: "mtt",
    number: 5,
    name: "5-sonli 'Mitti Qadamlar' davlat maktabgacha ta'lim tashkiloti",
    address: "Yoshlik ko'chasi, 8-uy",
    mahalla: "Yoshlik mahallasi",
    director: "Bobojonova Sayyora Rustamovna",
    phone: "+998 (62) 352-51-09",
    email: "mtt5@talim-tashkiloti.uz",
    studentsCount: 280,
    teachersCount: 32,
    shifts: 1,
    establishedYear: 2018,
    rating: 4.9,
    photoUrl: preschoolBuilding,
    description: "'Ilk qadam' dasturi asosida faoliyat yurituvchi tayanch maskan"
  }
];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: "doc-1",
    title: "2026/2027-o'quv yilida ta'lim-tarbiya jarayonini samarali tashkil etish to'g'risida",
    docNumber: "142-sonli tashkilot buyrug'i",
    date: "2026-08-25",
    category: "Tashkilot buyruqlari",
    fileUrl: "https://drive.google.com",
    fileSize: "1.4 MB",
    fileType: "PDF"
  },
  {
    id: "doc-2",
    title: "Ta'lim maskanlarida bolalarning sog'lom ovqatlanishi va xavfsizligini ta'minlash standartlari",
    docNumber: "88-sonli nizom",
    date: "2026-09-10",
    category: "Nizom va qoidalar",
    fileUrl: "https://drive.google.com",
    fileSize: "890 KB",
    fileType: "PDF"
  },
  {
    id: "doc-3",
    title: "Pedagog kadrlarni attestatsiyadan o'tkazish va malaka toifalarini berish tartibi to'g'risida",
    docNumber: "VMR-512 qarori",
    date: "2026-07-15",
    category: "Vazirlik buyruqlari",
    fileUrl: "https://drive.google.com",
    fileSize: "2.1 MB",
    fileType: "PDF"
  },
  {
    id: "doc-4",
    title: "Ta'lim muassasalarida kuz-qish mavsumiga tayyorgarlik ko'rish chora-tadbirlari",
    docNumber: "319-K qarori",
    date: "2026-10-02",
    category: "Hokim qarorlari",
    fileUrl: "https://drive.google.com",
    fileSize: "1.1 MB",
    fileType: "DOCX"
  }
];

export const INITIAL_APPEALS: CitizenAppeal[] = [
  {
    id: "app-101",
    trackingCode: "ORG-2026-4412",
    fullName: "Davlatov Anvar Ilhomovich",
    phone: "+998 91 422 10 20",
    email: "anvar.d@mail.uz",
    address: "Shixmashhad mahallasi",
    organizationType: "14-sonli maktab",
    subject: "1-sinfga qabul bo'yicha hujjatlar qabuli muddati",
    message: "Assalomu alaykum. Farzandimni 14-sonli maktabga 1-sinfga elektron tizim orqali ariza berish jarayonida qanday qo'shimcha ma'lumotnoma talab etiladi?",
    date: "2026-11-04",
    status: "ijro_etildi",
    replyMessage: "Hurmatli fuqaro! Nizomga muvofiq, qabulda faqat bolaning tug'ilganlik haqidagi guvohnomasi va ota-onaning pasport ma'lumotlari elektron tizim orqali avtomatik tekshiriladi.",
    replyDate: "2026-11-06",
    officer: "Direktor o'rinbosari Sh.Matyoqubov"
  },
  {
    id: "app-102",
    trackingCode: "ORG-2026-5893",
    fullName: "Karimova Ziyoda Bahromovna",
    phone: "+998 93 711 34 55",
    address: "Yoshlik mahallasi",
    organizationType: "5-sonli MTT",
    subject: "Qabul navbati holatini tasdiqlash",
    message: "Salom, 5-sonli 'Mitti qadamlar' maskaniga my.gov.uz orqali ariza qoldirgan edim. Qabul vaqti va guruhlar shakllantirilishi haqida ma'lumot bersangiz.",
    date: "2026-11-08",
    status: "jarayonda",
    officer: "Tayyorlov yo'nalishi rahbari G.Sobirova"
  }
];
