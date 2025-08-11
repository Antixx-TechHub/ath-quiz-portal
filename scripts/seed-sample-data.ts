import 'dotenv/config'
import { prisma } from '@/src/lib/db'
async function main() {
  const admin = await prisma.user.findFirst(); if (!admin) throw new Error('Run seed-admin first')
  const set = await prisma.questionSet.upsert({ where: { id: 'SAMPLE_SET_ID' }, update: {}, create: { id: 'SAMPLE_SET_ID', name: 'General Knowledge – Sample 20', createdById: admin.id, isActive: true } })
  await prisma.question.deleteMany({ where: { questionSetId: set.id } })
  let order = 1; const items = [
  [
    "What is 2 + 2?",
    [
      "3",
      "4",
      "5",
      "6"
    ],
    "SC",
    [
      1
    ]
  ],
  [
    "Capital of France?",
    [
      "Lyon",
      "Marseille",
      "Paris",
      "Nice"
    ],
    "SC",
    [
      2
    ]
  ],
  [
    "H2O is chemical formula for?",
    [
      "Oxygen",
      "Hydrogen",
      "Water",
      "Helium"
    ],
    "SC",
    [
      2
    ]
  ],
  [
    "Which is a mammal?",
    [
      "Shark",
      "Dolphin",
      "Octopus",
      "Tuna"
    ],
    "SC",
    [
      1
    ]
  ],
  [
    "Largest planet?",
    [
      "Earth",
      "Jupiter",
      "Mars",
      "Venus"
    ],
    "SC",
    [
      1
    ]
  ],
  [
    "Which is a prime?",
    [
      "9",
      "15",
      "17",
      "21"
    ],
    "SC",
    [
      2
    ]
  ],
  [
    "HTTP status for Not Found?",
    [
      "200",
      "301",
      "404",
      "500"
    ],
    "SC",
    [
      2
    ]
  ],
  [
    "Binary of 2?",
    [
      "10",
      "11",
      "01",
      "00"
    ],
    "SC",
    [
      0
    ]
  ],
  [
    "Git command to clone?",
    [
      "git copy",
      "git clone",
      "git fetch",
      "git init"
    ],
    "SC",
    [
      1
    ]
  ],
  [
    "CSS stands for?",
    [
      "Cascading Style Sheets",
      "Computer Styled Sections",
      "Creative Style System",
      "None"
    ],
    "SC",
    [
      0
    ]
  ],
  [
    "Select prime numbers",
    [
      "2",
      "3",
      "4",
      "5"
    ],
    "MC",
    [
      0,
      1,
      3
    ]
  ],
  [
    "Front-end frameworks",
    [
      "React",
      "Django",
      "Angular",
      "Vue"
    ],
    "MC",
    [
      0,
      2,
      3
    ]
  ],
  [
    "Cloud providers",
    [
      "AWS",
      "Azure",
      "Heroku",
      "GCP"
    ],
    "MC",
    [
      0,
      1,
      3
    ]
  ],
  [
    "Select fruits",
    [
      "Carrot",
      "Apple",
      "Banana",
      "Potato"
    ],
    "MC",
    [
      1,
      2
    ]
  ],
  [
    "Even numbers",
    [
      "1",
      "2",
      "3",
      "4"
    ],
    "MC",
    [
      1,
      3
    ]
  ],
  [
    "HTTP methods",
    [
      "PUT",
      "PUSH",
      "POST",
      "GET"
    ],
    "MC",
    [
      0,
      2,
      3
    ]
  ],
  [
    "NoSQL databases",
    [
      "MongoDB",
      "PostgreSQL",
      "Redis",
      "Cassandra"
    ],
    "MC",
    [
      0,
      2,
      3
    ]
  ],
  [
    "Linux distributions",
    [
      "Ubuntu",
      "Windows",
      "Fedora",
      "Debian"
    ],
    "MC",
    [
      0,
      2,
      3
    ]
  ],
  [
    "Programming languages",
    [
      "HTML",
      "Java",
      "CSS",
      "Go"
    ],
    "MC",
    [
      1,
      3
    ]
  ],
  [
    "JS bundlers",
    [
      "Webpack",
      "Vite",
      "NPM",
      "Rollup"
    ],
    "MC",
    [
      0,
      1,
      3
    ]
  ]
]
  for (const it of items) { await prisma.question.create({ data: { questionSetId: set.id, text: it[0], options: it[1], type: it[2], correctIndices: it[3], order: order++ } }) }
  const quiz = await prisma.quiz.upsert({ where: { quizCode: 'QUIZ-DEMO1' }, update: {}, create: { quizCode: 'QUIZ-DEMO1', name: 'Demo Quiz', questionSetId: set.id, createdById: admin.id } })
  console.log('Seeded set + demo quiz:', quiz.quizCode)
}
main().then(()=>process.exit(0)).catch(e=>{ console.error(e); process.exit(1) })
