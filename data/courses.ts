export type Course = {
  code: string;
  title: string;
  credits?: number;
  category?: string;
};

export type Semester = {
  semester: number;
  courses: Course[];
};

export type Department = {
  id: string;
  name: string;
  icon: string;
  description: string;
  semesters: Semester[];
};

export const departments: Department[] = [
  {
    id: "political-science",
    name: "Political Science",
    icon: "🏛️",
    description:
      "Political theory, Indian politics, international relations, political thought and research.",
    semesters: [
      {
        semester: 1,
        courses: [
          {
            code: "POLS 100",
            title: "Political Theory",
            credits: 4,
            category: "Major",
          },
          {
            code: "POLS 101",
            title: "Government & Politics of Mizoram",
            credits: 4,
            category: "Major",
          },
          {
            code: "POLS 102",
            title: "Introduction to Political Science",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 2,
        courses: [
          {
            code: "POLS 103",
            title: "Indian Government & Politics",
            credits: 4,
            category: "Major",
          },
          {
            code: "POLS 104",
            title: "Major Political Systems",
            credits: 4,
            category: "Major",
          },
          {
            code: "POLS 105",
            title: "Introduction to the Constitution of India",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 3,
        courses: [
          {
            code: "POLS 200",
            title: "International Relations",
            credits: 4,
            category: "Major",
          },
          {
            code: "POLS 201",
            title: "Human Rights",
            credits: 4,
            category: "Major",
          },
          {
            code: "POLS 202",
            title: "Understanding Democracy",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 4,
        courses: [
          {
            code: "POLS 203",
            title: "Western Political Thought",
            credits: 4,
            category: "Major",
          },
          {
            code: "POLS 204",
            title: "The United Nations",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 5,
        courses: [
          {
            code: "POLS 300",
            title: "Indian Political Thought",
            credits: 4,
            category: "Major",
          },
          {
            code: "POLS 301",
            title: "Indian Foreign Policy",
            credits: 4,
            category: "Major",
          },
          {
            code: "POLS 302",
            title: "Forms of Government",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 6,
        courses: [
          {
            code: "POLS 303",
            title: "Political Ideologies",
            credits: 4,
            category: "Major",
          },
          {
            code: "POLS 304",
            title: "Indian Politics: Processes & Issues",
            credits: 4,
            category: "Major",
          },
          {
            code: "POLS 305",
            title: "Public Administration",
            credits: 4,
            category: "Major",
          },
          {
            code: "POLS 306",
            title: "Political Sociology",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 7,
        courses: [
          {
            code: "POLS 400",
            title: "Research Methodology",
            credits: 4,
            category: "Major",
          },
          {
            code: "POLS 401",
            title: "Politics of Northeast India",
            credits: 4,
            category: "Major",
          },
          {
            code: "POLS 402",
            title: "Western Political Theory",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 8,
        courses: [
          {
            code: "POLS 403",
            title: "State Politics in India",
            credits: 4,
            category: "Major",
          },
          {
            code: "POLS 404",
            title: "Contemporary Political Theory",
            credits: 4,
            category: "Major",
          },
          {
            code: "POLS 405",
            title: "International Political Economy",
            credits: 4,
            category: "Honours",
          },
          {
            code: "POLS 406",
            title: "Modern Political Analysis",
            credits: 4,
            category: "Honours",
          },
          {
            code: "POLS 407",
            title: "Contemporary Political Issues",
            credits: 4,
            category: "Honours",
          },
          {
            code: "POLS 499",
            title: "Research Project / Dissertation",
            credits: 12,
            category: "Research Option",
          },
        ],
      },
    ],
  },

  {
    id: "sociology",
    name: "Sociology",
    icon: "👥",
    description:
      "Society, culture, institutions, social change, research and the transformation of Mizo society.",
    semesters: [
      {
        semester: 1,
        courses: [
          {
            code: "SOC/MJ/100",
            title: "Introduction to Sociology-I",
            credits: 4,
            category: "Major",
          },
          {
            code: "SOC/MJ/101",
            title: "Sociological Concepts-I",
            credits: 4,
            category: "Major",
          },
          {
            code: "SOC/MD/102",
            title: "Basic Sociological Concepts",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 2,
        courses: [
          {
            code: "SOC/MJ/103",
            title: "Social Institutions",
            credits: 4,
            category: "Major",
          },
          {
            code: "SOC/MJ/104",
            title: "Sociological Concepts-II",
            credits: 4,
            category: "Major",
          },
          {
            code: "SOC/MD/105",
            title: "Family, Marriage, Kinship",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 3,
        courses: [
          {
            code: "SOC/MJ/200",
            title: "Sociology of Indian Society-I",
            credits: 4,
            category: "Major",
          },
          {
            code: "SOC/MJ/201",
            title: "Social Problems in India",
            credits: 4,
            category: "Major",
          },
          {
            code: "SOC/MD/202",
            title: "Socialization and Culture",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 4,
        courses: [
          {
            code: "SOC/MJ/203",
            title: "Sociology of Indian Society-II",
            credits: 4,
            category: "Major",
          },
          {
            code: "SOC/MJ/204",
            title: "Social Change",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 5,
        courses: [
          {
            code: "SOC/MJ/300",
            title: "Rural Sociology",
            credits: 4,
            category: "Major",
          },
          {
            code: "SOC/MJ/301",
            title: "Foundation of Sociological Thought-I",
            credits: 4,
            category: "Major",
          },
          {
            code: "SOC/MJ/302",
            title: "Social Stratification",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 6,
        courses: [
          {
            code: "SOC/MJ/303",
            title: "Foundation of Sociological Thought-II",
            credits: 4,
            category: "Major",
          },
          {
            code: "SOC/MJ/304",
            title: "Social Research Methods-I",
            credits: 4,
            category: "Major",
          },
          {
            code: "SOC/MJ/305",
            title: "Urban Sociology",
            credits: 4,
            category: "Major",
          },
          {
            code: "SOC/MJ/306",
            title: "Conflict and Social Movements",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 7,
        courses: [
          {
            code: "SOC/MJ/400",
            title: "Society and Environment",
            credits: 4,
            category: "Major",
          },
          {
            code: "SOC/MJ/401",
            title: "Sociology of Religion",
            credits: 4,
            category: "Major",
          },
          {
            code: "SOC/MJ/402",
            title: "Social Research Methods-II",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 8,
        courses: [
          {
            code: "SOC/MJ/403",
            title: "Modern Sociological Thought",
            credits: 4,
            category: "Major",
          },
          {
            code: "SOC/MJ/404",
            title: "Sociology of Gender",
            credits: 4,
            category: "Major",
          },
          {
            code: "SOC/MJ/405",
            title: "Structure and Transformation of Mizo Society",
            credits: 4,
            category: "Honours",
          },
          {
            code: "SOC/MJ/406",
            title: "Sociology of Education",
            credits: 4,
            category: "Honours",
          },
          {
            code: "SOC/MJ/407",
            title: "Crime and Society",
            credits: 4,
            category: "Honours",
          },
          {
            code: "SOC/MJ/499",
            title: "Dissertation",
            credits: 12,
            category: "Research Option",
          },
        ],
      },
    ],
  },

  {
    id: "public-administration",
    name: "Public Administration",
    icon: "🏢",
    description:
      "Administration, bureaucracy, governance, public policy, police administration and e-governance.",
    semesters: [
      {
        semester: 1,
        courses: [
          {
            code: "PUB 100",
            title: "Elements of Public Administration",
            credits: 4,
            category: "Major",
          },
          {
            code: "PUB 101",
            title: "Indian Administration",
            credits: 4,
            category: "Major",
          },
          {
            code: "PUB 102",
            title: "Elements of Public Administration",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 2,
        courses: [
          {
            code: "PUB 103",
            title: "Administrative Theory",
            credits: 4,
            category: "Major",
          },
          {
            code: "PUB 104",
            title: "Public Personnel Administration",
            credits: 4,
            category: "Major",
          },
          {
            code: "PUB 105",
            title: "Indian Administration",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 3,
        courses: [
          {
            code: "PUB 200",
            title: "Theories of Bureaucracy",
            credits: 4,
            category: "Major",
          },
          {
            code: "PUB 201",
            title: "Local Self-Government in India",
            credits: 4,
            category: "Major",
          },
          {
            code: "PUB 202",
            title: "Public Personnel Administration",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 4,
        courses: [
          {
            code: "PUB 203",
            title: "Politics and Administration in Mizoram",
            credits: 4,
            category: "Major",
          },
          {
            code: "PUB 204",
            title: "Office Management in Government",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 5,
        courses: [
          {
            code: "PUB 300",
            title: "International Administration",
            credits: 4,
            category: "Major",
          },
          {
            code: "PUB 301",
            title: "Social Welfare Administration",
            credits: 4,
            category: "Major",
          },
          {
            code: "PUB 302",
            title: "Public Financial Administration in India",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 6,
        courses: [
          {
            code: "PUB 303",
            title: "Civil Society and Administration",
            credits: 4,
            category: "Major",
          },
          {
            code: "PUB 304",
            title: "Police Administration",
            credits: 4,
            category: "Major",
          },
          {
            code: "PUB 305",
            title: "Tribal Development Administration in India",
            credits: 4,
            category: "Major",
          },
          {
            code: "PUB 306",
            title: "E-Governance",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 7,
        courses: [
          {
            code: "PUB 400",
            title: "Public Policy",
            credits: 4,
            category: "Major",
          },
          {
            code: "PUB 401",
            title: "Rural Development Administration",
            credits: 4,
            category: "Major",
          },
          {
            code: "PUB 402",
            title: "Research Methodology",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 8,
        courses: [
          {
            code: "PUB 403",
            title: "Environmental Administration",
            credits: 4,
            category: "Major",
          },
          {
            code: "PUB 404",
            title: "Development Administration in India",
            credits: 4,
            category: "Major",
          },
          {
            code: "PUB 405",
            title: "Disaster Management",
            credits: 4,
            category: "Honours",
          },
          {
            code: "PUB 406",
            title: "Comparative Public Administration",
            credits: 4,
            category: "Honours",
          },
          {
            code: "PUB 407",
            title: "Administrative Ethics",
            credits: 4,
            category: "Honours",
          },
          {
            code: "PUB 499",
            title: "Research Project / Dissertation",
            credits: 12,
            category: "Research Option",
          },
        ],
      },
    ],
  },

  {
    id: "history",
    name: "History",
    icon: "📜",
    description:
      "Indian, Mizo, Northeast, world and European history with archaeology and historical research.",
    semesters: [
      {
        semester: 1,
        courses: [
          {
            code: "HIST 100",
            title: "History of India upto Maurya Period",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 101",
            title: "History of India from Post-Maurya to Gupta Period",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 102",
            title: "South Asian Prehistory",
            credits: 4,
            category: "Optional",
          },
          {
            code: "HIST 103",
            title: "Cultural Practices of Mizoram",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 2,
        courses: [
          {
            code: "HIST 104",
            title: "History of Mizoram upto 1986",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 105",
            title: "History of India – Regional Kingdoms and the Sultanate",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 106",
            title: "India and Southeast Asia",
            credits: 4,
            category: "Optional",
          },
          {
            code: "HIST 107",
            title: "Economic History of India",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 3,
        courses: [
          {
            code: "HIST 200",
            title: "The Mughals and Early Modern India",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 201",
            title: "Greece and Rome",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 202",
            title: "Gender and History",
            credits: 4,
            category: "Optional",
          },
          {
            code: "HIST 203",
            title: "Indian National Movement (1857–1947)",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 4,
        courses: [
          {
            code: "HIST 204",
            title: "Modern Indian History I",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 205",
            title: "Medieval Europe",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 206",
            title: "Introduction to Environmental History",
            credits: 4,
            category: "Optional",
          },
        ],
      },
      {
        semester: 5,
        courses: [
          {
            code: "HIST 300",
            title: "Modern Indian History II",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 301",
            title: "Freedom Movement in India (1857–1947)",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 302",
            title: "Early Modern Europe",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 303",
            title: "Introduction to Archaeology",
            credits: 4,
            category: "Optional",
          },
        ],
      },
      {
        semester: 6,
        courses: [
          {
            code: "HIST 304",
            title: "History, People and Cultures of Northeast India",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 305",
            title: "Modern World History",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 306",
            title: "Contemporary World History",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 307",
            title: "History of Modern China / History of USA",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 308",
            title: "Archaeology of Northeast India",
            credits: 4,
            category: "Optional",
          },
        ],
      },
      {
        semester: 7,
        courses: [
          {
            code: "HIST 400",
            title: "Historiography",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 401",
            title: "Introduction to Public History",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 402",
            title: "Field Project in Archives / Museums / Heritage",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 403",
            title: "Digital History",
            credits: 4,
            category: "Optional",
          },
        ],
      },
      {
        semester: 8,
        courses: [
          {
            code: "HIST 404",
            title: "Research Methodology",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 405",
            title: "Historical Research in the Digital Age",
            credits: 4,
            category: "Major",
          },
          {
            code: "HIST 406",
            title: "Field Project in Local and Community History",
            credits: 4,
            category: "Honours",
          },
          {
            code: "HIST 407",
            title: "Community Engagement and Service",
            credits: 4,
            category: "Honours",
          },
          {
            code: "HIST 408",
            title: "Approaches in History",
            credits: 4,
            category: "Honours",
          },
          {
            code: "HIST 409",
            title: "Colonial Ethnography in Mizoram",
            credits: 4,
            category: "Optional",
          },
          {
            code: "HIST 449",
            title: "Research Project / Dissertation",
            credits: 12,
            category: "Research Option",
          },
        ],
      },
    ],
  },

  {
    id: "english",
    name: "English",
    icon: "📚",
    description:
      "Literature, criticism, writing, communication, folklore, theory and works from Mizoram and Northeast India.",
    semesters: [
      {
        semester: 1,
        courses: [
          {
            code: "ENG 100",
            title: "Introduction to Literature",
            credits: 4,
            category: "Major",
          },
          {
            code: "ENG 101",
            title: "British Literature-I",
            credits: 4,
            category: "Major",
          },
          {
            code: "ENG 102",
            title: "Introduction to Poetry",
            credits: 3,
            category: "Multidisciplinary",
          },
          {
            code: "ENG 103",
            title: "Communication Skills",
            credits: 3,
            category: "AEC",
          },
        ],
      },
      {
        semester: 2,
        courses: [
          {
            code: "ENG 104",
            title: "World Literature",
            credits: 4,
            category: "Major",
          },
          {
            code: "ENG 105",
            title: "British Literature-II",
            credits: 4,
            category: "Major",
          },
          {
            code: "ENG 106",
            title: "Introduction to Prose",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 3,
        courses: [
          {
            code: "ENG 200",
            title: "American Literature",
            credits: 4,
            category: "Major",
          },
          {
            code: "ENG 201",
            title: "Children's Literature",
            credits: 4,
            category: "Major",
          },
          {
            code: "ENG 202",
            title: "Contemporary Short Stories from Mizoram",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 4,
        courses: [
          {
            code: "ENG 203",
            title: "Travel Writing",
            credits: 4,
            category: "Major",
          },
          {
            code: "ENG 204",
            title: "Writings from Northeast India",
            credits: 4,
            category: "Major",
          },
          {
            code: "ENG 205",
            title: "Grammar and Comprehension Skills",
            credits: 3,
            category: "AEC",
          },
        ],
      },
      {
        semester: 5,
        courses: [
          {
            code: "ENG 300",
            title: "Introduction to Folklore",
            credits: 4,
            category: "Major",
          },
          {
            code: "ENG 301",
            title: "Introduction to Literary Criticism",
            credits: 4,
            category: "Major",
          },
          {
            code: "ENG 302",
            title: "Popular Literature",
            credits: 4,
            category: "Major",
          },
          {
            code: "ENG 303",
            title: "Writing Skills",
            credits: 2,
            category: "AEC",
          },
        ],
      },
      {
        semester: 6,
        courses: [
          {
            code: "ENG 304",
            title: "Elizabethan Tragedy",
            credits: 4,
            category: "Major",
          },
          {
            code: "ENG 305",
            title: "Indian Writing in English",
            credits: 4,
            category: "Major",
          },
          {
            code: "ENG 306",
            title: "Women's Writing",
            credits: 4,
            category: "Major",
          },
          {
            code: "ENG 307",
            title: "Commonwealth Literature",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 7,
        courses: [
          {
            code: "ENG 400",
            title: "Greek Classical Literature",
            credits: 4,
            category: "Major",
          },
          {
            code: "ENG 401",
            title: "Literature and Cinema",
            credits: 4,
            category: "Major",
          },
          {
            code: "ENG 402",
            title: "Literary Criticism",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 8,
        courses: [
          {
            code: "ENG 403",
            title: "Literary Theory-I",
            credits: 4,
            category: "Major",
          },
          {
            code: "ENG 404",
            title: "Literary Theory-II",
            credits: 4,
            category: "Major",
          },
          {
            code: "ENG 405",
            title: "Young Adult Literature",
            credits: 4,
            category: "Honours",
          },
          {
            code: "ENG 406",
            title: "Modern European Literature",
            credits: 4,
            category: "Honours",
          },
          {
            code: "ENG 407",
            title: "Translation Studies",
            credits: 4,
            category: "Honours",
          },
          {
            code: "ENG 499",
            title: "Research Project / Dissertation",
            credits: 12,
            category: "Research Option",
          },
        ],
      },
    ],
  },

  {
    id: "education",
    name: "Education",
    icon: "🎓",
    description:
      "Foundations of education, curriculum, guidance, pedagogy, technology, mental health and educational research.",
    semesters: [
      {
        semester: 1,
        courses: [
          {
            code: "EDU 100",
            title: "Psychological Foundations of Education",
            credits: 4,
            category: "Major",
          },
          {
            code: "EDU 101",
            title: "Sociological Foundations of Education",
            credits: 4,
            category: "Major",
          },
          {
            code: "EDU 102",
            title: "Human Rights Education",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 2,
        courses: [
          {
            code: "EDU 103",
            title: "Philosophical Foundations of Education",
            credits: 4,
            category: "Major",
          },
          {
            code: "EDU 104",
            title: "Issues and Trends in Contemporary Indian Education",
            credits: 4,
            category: "Major",
          },
          {
            code: "EDU 105",
            title: "Peace Education",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 3,
        courses: [
          {
            code: "EDU 200",
            title: "Curriculum Development",
            credits: 4,
            category: "Major",
          },
          {
            code: "EDU 201",
            title: "Guidance and Counselling",
            credits: 4,
            category: "Major",
          },
          {
            code: "EDU 202",
            title: "Mental Health and Hygiene",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 4,
        courses: [
          {
            code: "EDU 203",
            title: "Development of Educational Thought",
            credits: 4,
            category: "Major",
          },
          {
            code: "EDU 204",
            title: "Early Childhood Care and Education",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 5,
        courses: [
          {
            code: "EDU 300",
            title: "Educational Technology",
            credits: 4,
            category: "Major",
          },
          {
            code: "EDU 301",
            title: "Pedagogy",
            credits: 4,
            category: "Major",
          },
          {
            code: "EDU 302",
            title: "Special Education",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 6,
        courses: [
          {
            code: "EDU 303",
            title: "Higher Education",
            credits: 4,
            category: "Major",
          },
          {
            code: "EDU 304",
            title: "Educational Planning and Management",
            credits: 4,
            category: "Major",
          },
          {
            code: "EDU 305",
            title: "Mental Health and Hygiene",
            credits: 4,
            category: "Major",
          },
          {
            code: "EDU 306",
            title: "Life Skills Education",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 7,
        courses: [
          {
            code: "EDU 400",
            title: "Research Methodology in Education",
            credits: 4,
            category: "Major",
          },
          {
            code: "EDU 401",
            title: "Educational Evaluation",
            credits: 4,
            category: "Major",
          },
          {
            code: "EDU 402",
            title: "Development of Education in India",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 8,
        courses: [
          {
            code: "EDU 403",
            title: "Statistics in Education",
            credits: 4,
            category: "Major",
          },
          {
            code: "EDU 404",
            title: "Human Rights Education",
            credits: 4,
            category: "Major",
          },
          {
            code: "EDU 405",
            title: "Gender, Education and Society",
            credits: 4,
            category: "Honours",
          },
          {
            code: "EDU 406",
            title: "Progress of Education in Mizoram",
            credits: 4,
            category: "Honours",
          },
          {
            code: "EDU 407",
            title: "Peace Education",
            credits: 4,
            category: "Honours",
          },
          {
            code: "EDU 499",
            title: "Dissertation / Research Project",
            credits: 12,
            category: "Research Option",
          },
        ],
      },
    ],
  },

  {
    id: "economics",
    name: "Economics",
    icon: "📈",
    description:
      "Microeconomics, macroeconomics, rural development, finance, trade, quantitative techniques and development.",
    semesters: [
      {
        semester: 1,
        courses: [
          {
            code: "ECO 100",
            title: "Rural Development",
            credits: 4,
            category: "Major",
          },
          {
            code: "ECO 101",
            title: "Microeconomics-I",
            credits: 4,
            category: "Major",
          },
          {
            code: "ECO 102",
            title: "Fundamentals of Economics-I",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 2,
        courses: [
          {
            code: "ECO 103",
            title: "Financial Institutions & Markets",
            credits: 4,
            category: "Major",
          },
          {
            code: "ECO 104",
            title: "Microeconomics-II",
            credits: 4,
            category: "Major",
          },
          {
            code: "ECO 105",
            title: "Fundamentals of Economics-II",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 3,
        courses: [
          {
            code: "ECO 200",
            title: "Environmental Economics",
            credits: 4,
            category: "Major",
          },
          {
            code: "ECO 201",
            title: "Macroeconomics-I",
            credits: 4,
            category: "Major",
          },
          {
            code: "ECO 202",
            title: "Fundamentals of Economics-III",
            credits: 3,
            category: "Multidisciplinary",
          },
        ],
      },
      {
        semester: 4,
        courses: [
          {
            code: "ECO 203",
            title: "Public Finance",
            credits: 4,
            category: "Major",
          },
          {
            code: "ECO 204",
            title: "Macroeconomics-II",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 5,
        courses: [
          {
            code: "ECO 300",
            title: "Quantitative Techniques-I",
            credits: 4,
            category: "Major",
          },
          {
            code: "ECO 301",
            title: "Agriculture Economics",
            credits: 4,
            category: "Optional",
          },
          {
            code: "ECO 302",
            title: "Industrial Economics",
            credits: 4,
            category: "Optional",
          },
          {
            code: "ECO 303",
            title: "Indian Economy",
            credits: 4,
            category: "Major",
          },
        ],
      },
      {
        semester: 6,
        courses: [
          {
            code: "ECO 304",
            title: "Quantitative Techniques-II",
            credits: 4,
            category: "Major",
          },
          {
            code: "ECO 305",
            title: "International Trade",
            credits: 4,
            category: "Major",
          },
          {
            code: "ECO 306",
            title: "Demography",
            credits: 4,
            category: "Major",
          },
          {
            code: "ECO 307",
            title: "History of Economic Thought",
            credits: 4,
            category: "Major",
          },
          {
            code: "ECO 308",
            title: "Economics of Growth and Development",
            credits: 4,
            category: "Major",
          },
        ],
      },
    ],
  },
  {
    id: "vac",
    name: "Value Added Courses",
    icon: "✦",
    description:
      "Human values, understanding India and environmental science for every student.",
    semesters: [
      {
        semester: 1,
        courses: [
          {
            code: "VAC 101",
            title: "Universal Human Values",
            credits: 2,
            category: "Value Added Course",
          },
        ],
      },
      {
        semester: 2,
        courses: [
          {
            code: "VAC 102",
            title: "Understanding India",
            credits: 2,
            category: "Value Added Course",
          },
        ],
      },
      {
        semester: 3,
        courses: [
          {
            code: "VAC 103",
            title: "Environmental Science",
            credits: 2,
            category: "Value Added Course",
          },
        ],
      },
    ],
  },
];
