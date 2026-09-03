export type SyllabusUnit = {
  title: string;
  topics: string[];
};

export type DetailedCourse = {
  code: string;
  title: string;
  semester: number;
  units: SyllabusUnit[];
};

export const politicalScienceDetails: DetailedCourse[] = [
  {
    code: "POLS 100",
    title: "Political Theory",
    semester: 1,
    units: [
      {
        title: "Unit I",
        topics: [
          "Political Theory: Meaning, Scope and Significance",
          "Traditional Approach",
          "Behavioural Approach",
          "Marxist Approach",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "State: Liberal and Marxist theories of origin",
          "Sovereignty: Meaning, Characteristics and Types",
          "Monistic View of Sovereignty",
          "Pluralist View of Sovereignty",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Liberty: Meaning and Kinds",
          "Equality: Meaning and Kinds",
          "Rights: Meaning and Kinds",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Justice: Meaning and Kinds",
          "Rawls' Theory of Justice",
          "Democracy: Meaning",
          "Direct and Indirect Democracy",
          "Elitist Theory of Democracy",
          "Pluralist Theory of Democracy",
          "Marxist Theory of Democracy",
        ],
      },
    ],
  },

  {
    code: "POLS 101",
    title: "Government & Politics of Mizoram",
    semester: 1,
    units: [
      {
        title: "Unit I",
        topics: [
          "A brief political history of Mizoram (1890–1986)",
          "Chieftainship: Powers and Functions",
          "Inner Line Regulation: Provisions and Relevance",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "MNF Movement: Causes and Consequences",
          "Memorandum of Settlement, 1986",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Political Parties in Mizoram",
          "Defunct Parties: Mizo Union and United Mizo Freedom Organization",
          "National and Regional Parties as listed in the 2023 syllabus",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Local Self-Governments in Mizoram",
          "Municipal Corporation / Municipal Council: Structure, Powers and Functions",
          "Village Councils: Composition, Powers and Functions",
          "Autonomous District Councils: Structure, Powers and Functions",
        ],
      },
    ],
  },

  {
    code: "POLS 102",
    title: "Introduction to Political Science",
    semester: 1,
    units: [
      {
        title: "Unit I",
        topics: [
          "Evolution of Political Science as a discipline",
          "Meaning and Scope of Political Science",
          "Significance of the Study of Political Science",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "State: Definition and Elements",
          "Divine Origin Theory",
          "Social Contract Theory",
          "Evolutionary Theory",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Liberty: Meaning and Kinds",
          "Equality: Meaning and Kinds",
          "Justice: Meaning and Kinds",
        ],
      },
    ],
  },

  {
    code: "POLS 103",
    title: "Indian Government & Politics",
    semester: 2,
    units: [
      {
        title: "Unit I",
        topics: [
          "Preamble and Salient Features of the Constitution",
          "Fundamental Rights",
          "Fundamental Duties",
          "Directive Principles of State Policy",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Nature of Indian Federalism",
          "Amendment Procedure",
          "Emergency Provisions",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Union Legislature",
          "Prime Minister",
          "State Legislature",
          "Chief Minister",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Supreme Court and High Court",
          "President",
          "Governor",
        ],
      },
    ],
  },

  {
    code: "POLS 104",
    title: "Major Political Systems",
    semester: 2,
    units: [
      {
        title: "Unit I",
        topics: [
          "Salient Features of the British Political System",
          "Monarchy",
          "Parliament",
          "Cabinet",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Salient Features of the U.S. Political System",
          "President",
          "Congress",
          "Supreme Court",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Salient Features of the Swiss Political System",
          "Federal Council",
          "Federal Assembly",
          "Federal Tribunal",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Salient Features of the Chinese Political System",
          "National People's Congress",
          "President of the PRC",
          "State Council",
        ],
      },
    ],
  },

  {
    code: "POLS 105",
    title: "Introduction to the Constitution of India",
    semester: 2,
    units: [
      {
        title: "Unit I",
        topics: [
          "Salient Features of the Indian Constitution",
          "Preamble",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Fundamental Rights",
          "Fundamental Duties",
          "Directive Principles of State Policy",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Lok Sabha: Composition, Powers and Functions",
          "Rajya Sabha: Composition, Powers and Functions",
        ],
      },
    ],
  },

  {
    code: "POLS 200",
    title: "International Relations",
    semester: 3,
    units: [
      {
        title: "Unit I",
        topics: [
          "International Relations: Meaning, Nature and Scope",
          "Realist Approach",
          "Idealist Approach",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Sovereign Nation-State System: Nature and Evolution",
          "National Interest: Meaning and Components",
          "Instruments for Promotion of National Interest",
          "National Power: Meaning and Elements",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Decolonization and Emergence of the Third World",
          "Non-Aligned Movement",
          "Relevance of NAM in the Post-Cold War Era",
          "Cold War: Impact and End",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Balance of Power",
          "Collective Security",
          "Diplomacy",
          "Terrorism",
        ],
      },
    ],
  },

  {
    code: "POLS 201",
    title: "Human Rights",
    semester: 3,
    units: [
      {
        title: "Unit I",
        topics: [
          "Meaning and Classification of Human Rights",
          "Major Landmarks before the United Nations",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Universal Declaration of Human Rights, 1948",
          "International Covenant on Civil and Political Rights, 1966",
          "International Covenant on Economic, Social and Cultural Rights, 1966",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Human Rights and the United Nations",
          "Rights of Women",
          "Rights of Children",
          "Rights of Minorities",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Amnesty International",
          "National Human Rights Commission of India",
        ],
      },
    ],
  },

  {
    code: "POLS 202",
    title: "Understanding Democracy",
    semester: 3,
    units: [
      {
        title: "Unit I",
        topics: [
          "Meaning and Features of Democracy",
          "Direct Democracy",
          "Indirect / Representative Democracy",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Procedural Democracy",
          "Substantive Democracy",
          "Challenges to Democracy",
          "Remedies to Challenges",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Election Commission of India: Composition",
          "Election Commission of India: Powers and Functions",
          "ECI as Guardian of Indian Democracy",
        ],
      },
    ],
  },

  {
    code: "POLS 203",
    title: "Western Political Thought",
    semester: 4,
    units: [
      {
        title: "Unit I",
        topics: [
          "Plato: Justice",
          "Plato: Education",
          "Plato: Communism",
          "Plato: Ideal State",
          "Aristotle: Classification of Constitutions",
          "Aristotle: Best Practicable State",
          "Aristotle: Revolution",
          "Aristotle: Slavery",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Machiavelli: Religion and Morality",
          "Machiavelli: State",
          "Hobbes: Social Contract Theory",
          "Locke: Social Contract Theory",
          "Rousseau: Social Contract Theory",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Bentham: Utilitarianism",
          "J.S. Mill: Liberty",
          "J.S. Mill: Democracy",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Hegel: Dialectics and State",
          "Marx: Dialectical Materialism",
          "Marx: Historical Materialism",
          "Marx: Theory of Revolution",
          "Marx: Class Struggle",
          "Marx: Surplus Value",
        ],
      },
    ],
  },

  {
    code: "POLS 204",
    title: "The United Nations",
    semester: 4,
    units: [
      {
        title: "Unit I",
        topics: [
          "Origin and Development of the United Nations",
          "UN Charter: Objectives and Principles",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "General Assembly",
          "Security Council",
          "Economic and Social Council",
          "Secretariat",
          "International Court of Justice",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "ILO",
          "UNESCO",
          "WHO",
          "UNICEF",
          "UNDP",
          "UNEP",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Role of the UN in the Post-Cold War Period",
          "UN Reform: Issues and Debates",
        ],
      },
    ],
  },

  {
    code: "POLS 300",
    title: "Indian Political Thought",
    semester: 5,
    units: [
      {
        title: "Unit I",
        topics: [
          "Sources of Indian Political Thought",
          "Kautilya: Arthashastra",
          "Kautilya: Theory of Government",
          "Kautilya: Statecraft",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Raja Ram Mohan Roy: Liberalism",
          "Swami Vivekananda: Nationalism",
          "Swami Vivekananda: Internationalism",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Gopal Krishna Gokhale: Swadeshi",
          "Bal Gangadhar Tilak: Swaraj",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Mahatma Gandhi: Non-Violence",
          "Mahatma Gandhi: Satyagraha",
          "Jawaharlal Nehru: Socialism",
          "Jawaharlal Nehru: Secularism",
          "B.R. Ambedkar: Social Justice",
        ],
      },
    ],
  },

  {
    code: "POLS 301",
    title: "Indian Foreign Policy",
    semester: 5,
    units: [
      {
        title: "Unit I",
        topics: [
          "Determinants of Indian Foreign Policy",
          "Principles and Objectives",
          "Policy of Non-Alignment",
          "India's Nuclear Policy",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "India-US Relations",
          "Indo-US Nuclear Deal",
          "Post-Cold War India-US Relations",
          "India-Russia Relations",
          "India-China Relations",
          "India-China Tension Areas",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "India-Pakistan Relations",
          "India-Sri Lanka Relations",
          "Indo-Sri Lankan Accord, 1987",
          "Indian Peace Keeping Force",
          "India-Bangladesh Relations",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "India-Myanmar Relations",
          "Areas of Cooperation and Challenges",
          "Look East / Act East Policy",
          "India as an Emerging Global Power",
        ],
      },
    ],
  },

  {
    code: "POLS 302",
    title: "Forms of Government",
    semester: 5,
    units: [
      {
        title: "Unit I",
        topics: [
          "Legislature: Meaning, Types and Functions",
          "Executive: Meaning, Types and Functions",
          "Judiciary: Role and Functions",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Unitary Government: Meaning and Characteristics",
          "Federal Government: Meaning and Characteristics",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Parliamentary System: Meaning and Characteristics",
          "Presidential System: Meaning and Characteristics",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Democracy: Meaning and Types",
          "Merits and Demerits of Democracy",
          "Dictatorship: Meaning and Types",
          "Merits and Demerits of Dictatorship",
        ],
      },
    ],
  },

  {
    code: "POLS 303",
    title: "Political Ideologies",
    semester: 6,
    units: [
      {
        title: "Unit I",
        topics: [
          "Classical Liberalism: Meaning and Characteristics",
          "Positive Liberalism: Meaning and Characteristics",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Liberal Feminism: Core Themes",
          "Radical Feminism: Core Themes",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Multiculturalism: Meaning and Features",
          "Kymlicka's Model of Multiculturalism",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Communitarianism: Meaning and Characteristics",
          "Communitarian Critique of Individualism",
        ],
      },
    ],
  },

  {
    code: "POLS 304",
    title: "Indian Politics: Processes & Issues",
    semester: 6,
    units: [
      {
        title: "Unit I",
        topics: [
          "Political Parties: Meaning and Types",
          "Characteristics of the Party System in India",
          "Recognition of National and Regional Parties",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Single Party Dominance",
          "Coalition Politics at the Centre",
          "Left and Right-Wing Parties",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Election Commission of India",
          "Representation of the People's Act, 1951",
          "Anti-Defection Law, 1985",
          "Electoral Reforms in India",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Communalism: Meaning, Causes and Remedies",
          "Regionalism: Meaning, Forms and Remedies",
          "Constitutional Reservation for Scheduled Castes and Scheduled Tribes",
        ],
      },
    ],
  },

  {
    code: "POLS 305",
    title: "Public Administration",
    semester: 6,
    units: [
      {
        title: "Unit I",
        topics: [
          "Public Administration: Meaning, Scope and Significance",
          "Scientific Management Theory",
          "Human Relations Approach",
          "Bureaucratic Approach",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Organisation",
          "Hierarchy",
          "Centralisation",
          "Decentralisation",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Leadership",
          "Decision-Making",
          "Accountability",
          "Recruitment",
          "Training",
          "Promotion",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Preparation and Passing of Budget in India",
          "Comptroller and Auditor General",
          "Role of the Finance Ministry",
        ],
      },
    ],
  },

  {
    code: "POLS 306",
    title: "Political Sociology",
    semester: 6,
    units: [
      {
        title: "Unit I",
        topics: [
          "Political Sociology: Meaning, Emergence, Nature and Scope",
          "Structural-Functional Analysis",
          "Systems Analysis",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Power: Meaning and Kinds",
          "Elite Theory of Power",
          "Pluralist Theory of Power",
          "Marxian Theory of Power",
          "Authority: Meaning, Nature and Kinds",
          "Legitimacy: Meaning, Sources and Types",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Political Culture: Meaning and Typology",
          "Political Socialisation: Meaning and Agents",
          "Political Participation: Meaning and Forms",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Social Stratification: Nature and Elements",
          "Social Stratification in India",
          "Caste and Politics in India",
        ],
      },
    ],
  },

  {
    code: "POLS 400",
    title: "Research Methodology",
    semester: 7,
    units: [
      {
        title: "Unit I",
        topics: [
          "Scientific Study of Social Science Research",
          "Basic Assumptions",
          "Objectivity in Social Research",
          "Types and Methods of Research",
          "Research Ethics",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Hypotheses: Characteristics and Types",
          "Research Design",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Sampling",
          "Observation",
          "Questionnaire",
          "Schedule",
          "Interview",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Statistical Techniques of Data Analysis",
          "Use of Computers",
          "Report Writing",
          "Thesis Writing",
        ],
      },
    ],
  },

  {
    code: "POLS 401",
    title: "Politics of Northeast India",
    semester: 7,
    units: [
      {
        title: "Unit I",
        topics: [
          "British Colonialism and Northeast India",
          "Political, Economic and Social Impact",
          "Backward Tracts",
          "Excluded and Partially Excluded Areas",
          "Inner Line Regulation and its Relevance",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Sixth Schedule: Constitutional History",
          "Salient Provisions",
          "Working of Autonomous Governments",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Categorization of States by the 1950 Constitution",
          "Reorganisation of States: 1956 and 1971",
          "Nagaland",
          "Mizoram",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "North Eastern Council",
          "Ministry of Development of North Eastern Region",
        ],
      },
    ],
  },

  {
    code: "POLS 402",
    title: "Western Political Theory",
    semester: 7,
    units: [
      {
        title: "Unit I",
        topics: [
          "Nature and Significance of Political Theory",
          "Importance of Classical Tradition",
          "Limitations of Classical Tradition",
          "Traditional and Contemporary Approaches",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Decline of Political Theory Debate",
          "Revival of Political Theory",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Role and Impact of Ideology",
          "End of Ideology Debate",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Recent Trends in Political Theory",
          "Postmodernism",
          "Post-Colonialism",
        ],
      },
    ],
  },

  {
    code: "POLS 403",
    title: "State Politics in India",
    semester: 8,
    units: [
      {
        title: "Unit I",
        topics: [
          "Introduction to State Politics",
          "Evolution of State Politics in India",
          "Myron Weiner's Framework",
          "Iqbal Narain's Framework",
          "Marxist Framework",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Socio-Economic Determinants of State Politics",
          "Centre-State Political Relationships",
          "Centre-State Economic Relationships",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Regional Political Parties in National Politics",
          "Impact of National Politics on State Politics",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Human Development Index in State Politics",
          "Comparative Perspective of HDI among States",
          "Local Self-Government after the 73rd and 74th Constitutional Amendment Acts",
        ],
      },
    ],
  },

  {
    code: "POLS 404",
    title: "Contemporary Political Theory",
    semester: 8,
    units: [
      {
        title: "Unit I",
        topics: [
          "Rethinking Marxism",
          "Lenin: Imperialism",
          "Mao: Cultural Revolution",
          "Gramsci: Hegemony",
          "Marcuse: Technological Rationality",
          "Habermas: Communicative Action",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Charles Taylor: Politics of Recognition",
          "Bikhu Parekh: Multiculturalism",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Foucault: Power",
          "Derrida: Deconstruction",
          "Lyotard: Knowledge",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Amitai Etzioni: Communitarianism",
          "Michael Sandel: Civil Society",
        ],
      },
    ],
  },

  {
    code: "POLS 405",
    title: "International Political Economy",
    semester: 8,
    units: [
      {
        title: "Unit I",
        topics: [
          "Mercantilism",
          "Liberalism",
          "Marxism",
          "Protectionism",
          "Comparative Advantage",
          "Trade as a Foreign Policy Tool",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "International Regimes",
          "Hegemonic Stability Thesis",
          "After Hegemony",
          "North-South Cooperation",
          "South-South Cooperation",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "GATT",
          "World Trade Organization",
          "UNCTAD",
          "World Bank",
          "International Monetary Fund",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Multinational Corporations and FDI",
          "MNC-Host Government Relations",
          "Globalization",
          "Environmental and Ecological Problems",
          "Environmental Protection and Free Trade",
        ],
      },
    ],
  },

  {
    code: "POLS 406",
    title: "Modern Political Analysis",
    semester: 8,
    units: [
      {
        title: "Unit I",
        topics: [
          "Political Analysis: Meaning, Scope and Significance",
          "Normatism",
          "Empiricism",
          "Behavioural Approach",
          "Post-Behavioural Approach",
          "Elements of Scientific Method",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Political Systems: Types, Similarities and Differences",
          "Aristotle's Classification",
          "Weber's Classification",
          "Robert Dahl's Classification",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Power",
          "Authority",
          "Legitimacy",
          "Difference Between Power and Authority",
          "Measurement of Power",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Harold Lasswell: Distributive Analysis",
          "S.M. Lipset: Political Man",
          "Robert A. Dahl: Modern Political Analysis",
        ],
      },
    ],
  },

  {
    code: "POLS 407",
    title: "Contemporary Political Issues",
    semester: 8,
    units: [
      {
        title: "Unit I",
        topics: [
          "End of History Debate",
          "Clash of Civilizations Debate",
          "Liberals versus Realists",
          "Unipolarity versus Multipolarity",
        ],
      },
      {
        title: "Unit II",
        topics: [
          "Role of State and Non-State Actors",
          "World Bank",
          "International Monetary Fund",
          "Globalisation versus State Sovereignty",
        ],
      },
      {
        title: "Unit III",
        topics: [
          "Global Warming",
          "Environmental Issues in the United Nations",
        ],
      },
      {
        title: "Unit IV",
        topics: [
          "Good Governance: Concept and Origin",
          "Good Governance and Developmental Issues",
        ],
      },
    ],
  },
];