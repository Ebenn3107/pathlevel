# PathLevel — Step 1: Learning & Knowledge Domain Model

## Status

**Status:** Conceptual design / pre-implementation  
**Scope:** Step 1A–1D  
**Purpose:** Mendokumentasikan keputusan konseptual yang sudah dibahas sebelum masuk ke User Flow & UX (Step 2).

---

# 1. Product Direction

PathLevel bukan sekadar Todo List, Habit Tracker, atau LMS.

Core problem yang ingin diselesaikan:

> User sering menemukan informasi menarik dari media sosial, YouTube, artikel, screenshot, PDF, dan sumber lain. Informasi tersebut sering disimpan sebagai bookmark atau screenshot lalu terlupakan. PathLevel menjadi tempat untuk menangkap informasi, mempertahankan konteksnya, menemukannya kembali ketika relevan, dan mengubah informasi tertentu menjadi proses belajar yang terstruktur.

Core loop:

```text
DISCOVER
   ↓
CAPTURE
   ↓
LIBRARY
   ↓
ORGANIZE / UNDERSTAND
   ↓
SEARCH / RESURFACE
   ↓
ADD TO LEARNING
   ↓
LEARN
   ↓
PROGRESS
```

Prinsip utama:

- Tidak semua informasi yang disimpan harus dipelajari.
- Library menjadi fondasi knowledge system.
- Learning merupakan konteks untuk menggunakan knowledge yang sudah disimpan.
- Item tidak dipindahkan dari Library ke Learning.
- AI merupakan lapisan bantuan, bukan fondasi yang membuat fitur inti bergantung pada AI.
- Tasks, Habits, XP, dan Achievements merupakan supporting systems, bukan core product.
- Struktur Learning harus domain-agnostic dan dapat digunakan untuk berbagai bidang.

---

# 2. Step 1A — Library Data Model

## 2.1 Definisi Library

Library adalah tempat menyimpan informasi yang user temukan dan ingin pertahankan.

External information dapat berasal dari:

- YouTube
- Artikel
- Website
- PDF
- Screenshot/image
- Dokumentasi
- Course provider
- Sumber eksternal lainnya

Selain external information, PathLevel juga memiliki **Notes** sebagai bentuk knowledge yang dibuat user sendiri.

External Resource dan Note merupakan konsep yang berbeda, tetapi keduanya dapat dicari melalui satu global search.

## 2.2 External Resource dan Note Dipisahkan

```text
LIBRARY
│
├── External Resources
│   ├── YouTube
│   ├── Article
│   ├── PDF
│   ├── Website
│   └── Screenshot
│
└── Notes
    ├── Personal Note
    └── Learning Summary
```

External Resource dan Note memiliki sifat data yang berbeda.

### External Resource

Contoh metadata:

```text
title
url / attachment
type
provider
author
publishedAt
thumbnail
AI metadata
status
createdAt
updatedAt
```

### Note

Contoh metadata:

```text
title
content
type
context
createdAt
updatedAt
```

Di UI keduanya tetap berada di bawah:

```text
Library
```

dengan filter:

```text
All
Resources
Notes
Inbox
Archived
```

Global search dapat mencari:

```text
External Resources
+
Notes
+
Learning
```

## 2.3 External Resource Type

Untuk V1, type dibuat generik:

```text
LINK
IMAGE
FILE
TEXT
```

Type dan provider dipisahkan.

Contoh:

```text
type = LINK
provider = YouTube
```

atau:

```text
type = LINK
provider = Coursera
```

Jangan membuat type yang terlalu bergantung pada provider seperti `YOUTUBE_VIDEO` atau `COURSERA_COURSE`.

## 2.4 Core Data, Source Data, dan Enrichment Data

### Core Data

```text
id
userId
title
type
status
createdAt
updatedAt
```

### Source Data

```text
url
provider
author
publishedAt
thumbnail
```

Source metadata bersifat opsional karena tidak semua sumber menyediakan informasi yang sama.

### Enrichment Data

```text
summary
topics
concepts
aiMetadata
aiStatus
```

Metadata AI bersifat fleksibel dan bukan bagian dari core domain data.

## 2.5 Personal Context / Why I Saved This

External Resource dapat memiliki field singkat yang menjawab:

> Why did I save this?

Contoh:

```text
"Penjelasan Docker ini lebih mudah dipahami daripada dokumentasi resmi."
```

Field ini penting karena menyimpan konteks personal user.

Field bersifat opsional.

## 2.6 Topics

Satu resource dapat memiliki beberapa topic:

```text
Docker
Containers
DevOps
```

Untuk V1, taxonomy tidak perlu kompleks. Model dapat dikembangkan kemudian jika kebutuhan taxonomy yang lebih kaya benar-benar muncul.

## 2.7 Library Status

Status Library dibedakan dari hubungan dengan Learning.

```text
INBOX
SAVED
ARCHIVED
```

**Learning bukan status Library.**

Contoh:

```text
Resource
status = SAVED

linked to:
Backend Development → Docker Fundamentals
```

Resource tetap berada di Library walaupun digunakan dalam Learning.

## 2.8 Inbox

Inbox bukan Todo List baru dan bukan entity domain yang kompleks.

Inbox adalah konsep/filter untuk:

> Informasi yang baru ditangkap dan belum direview atau diorganisasi lebih lanjut.

```text
CAPTURE
   ↓
INBOX
```

Inbox merupakan bentuk **deferred organization**. Tujuannya menjaga capture tetap low-friction.

---

# 3. Learning Summary

Learning Summary dibedakan dari summary sumber dan personal context.

```text
SOURCE SUMMARY
"What is this resource about?"

PERSONAL CONTEXT
"Why did I save this?"

LEARNING SUMMARY
"What did I understand after learning?"
```

Learning Summary bersifat **opsional**.

Contoh prompt:

```text
What did you learn?

[ Optional ]
```

Tujuannya mendorong user menjelaskan kembali apa yang dipahami. Konsep ini diarahkan pada active recall / reconstruction of knowledge, bukan sekadar menyalin ulang materi.

Learning Summary dapat menjadi evidence bahwa user telah melakukan refleksi terhadap materi yang dipelajari.

---

# 4. Pemanfaatan Data User

Data yang disimpan user dapat memiliki nilai lebih dari sekadar storage.

Contoh:

```text
External Resource
       ↓
Source / AI Summary
       ↓
User Learning Summary
```

Di masa depan data tersebut dapat digunakan untuk:

- review
- resurfacing forgotten knowledge
- related knowledge
- learning recommendations
- knowledge gap suggestions
- AI-assisted search
- RAG

Contoh:

```text
User:
"Apa yang saya pahami tentang PostgreSQL indexing?"
```

PathLevel dapat mengambil:

```text
External Resource
+
Personal Notes
+
Learning Summary
+
Learning Unit context
```

dan LLM dapat menyusun jawaban berdasarkan knowledge user sendiri.

---

# 5. AI dan RAG

AI tidak menjadi fondasi utama V1.

Prinsip:

> AI/RAG harus berada di atas domain Knowledge/Library/Learning, bukan menjadi fondasi yang membuat fitur dasar bergantung pada AI.

Roadmap konseptual:

### Core Product

```text
Capture
Library
Notes
Search
Learning
Progress
```

### AI Enrichment

```text
Summary
Topic Suggestions
Learning Suggestions
```

### Future RAG

```text
Semantic Search
Ask My Knowledge
Related Knowledge
Contextual Resurfacing
```

RAG cocok sebagai pengembangan masa depan karena PathLevel akan memiliki:

```text
External Resources
Notes
Learning Units
Learning Sessions
Learning Summaries
Topics
User Context
```

## 5.1 RAG vs Training

### RAG

Model tidak diubah.

```text
Knowledge Base
      ↓
Retrieve
      ↓
LLM
```

### Fine-tuning

Model dilatih menggunakan dataset untuk mengubah perilaku/parameter tertentu.

### Training from scratch

Model dibangun/dilatih dari awal.

Untuk PathLevel:

> RAG lebih relevan dengan problem produk daripada training model sendiri.

Fine-tuning dapat menjadi eksperimen pembelajaran AI yang terpisah.

## 5.2 AI-Ready Architecture

Tidak perlu membuat tabel AI kompleks sejak awal.

Domain data cukup dibuat terstruktur sehingga nantinya dapat dibuat:

```text
Knowledge Data
      ↓
Ingestion
      ↓
Chunking
      ↓
Embedding
      ↓
Vector Store
      ↓
Retrieval
      ↓
LLM
```

Embedding merupakan derived representation dan tidak perlu menjadi bagian dari domain object utama.

---

# 6. Step 1B — Relationship Library → Learning

Prinsip utama:

> **Resource atau Note tidak dipindahkan dari Library ke Learning.**

Learning hanya membuat hubungan dengan item yang sudah ada.

```text
LIBRARY

How Docker Actually Works
        │
        └──── linked to ────→ Docker Fundamentals
```

Resource tetap berada di Library.

## 6.1 Mengapa Tidak Boleh Diduplikasi?

Tidak diinginkan:

```text
Library
└── How Docker Actually Works

Learning
└── Docker Fundamentals
    └── How Docker Actually Works
```

Karena ada dua salinan data yang sama.

Model yang diinginkan:

```text
External Resource
        │
        │ relationship
        ↓
Learning Unit
```

Learning hanya menyimpan hubungan.

## 6.2 Many-to-Many Relationship

Satu resource dapat digunakan oleh beberapa Learning Unit dan satu Learning Unit dapat memiliki banyak resource.

Contoh:

```text
PostgreSQL Indexing Guide
        ├── Backend Development → Database
        └── Data Engineering → Query Optimization
```

Secara konseptual:

```text
ExternalResource
       ↕
LearningUnit
```

Implementasi dapat menggunakan entity/tabel penghubung seperti:

```text
LearningResource
    resourceId
    learningUnitId
```

Nama final dapat disesuaikan saat technical design.

## 6.3 Note → Learning Unit

Personal Note juga dapat dikaitkan dengan Learning Unit.

```text
My Docker Architecture Notes
        ↓
Docker Fundamentals
```

Learning Unit dapat menggunakan:

```text
External Resources
+
Notes
```

sebagai material pendukung.

## 6.4 Learning Summary Berbeda dari Resource Relationship

Learning Summary bukan resource.

```text
Resource
    ↓
Learning Session
    ↓
Learning Summary
```

Relationship Resource → Learning Unit menjawab:

> "Resource mana yang membantu saya mempelajari unit ini?"

Learning Summary menjawab:

> "Apa yang saya pahami setelah belajar?"

---

# 7. Step 1C — Learning Model

Learning tidak didesain sebagai LMS atau course platform.

Jangan menggunakan struktur utama:

```text
Course
└── Module
    └── Lesson
        └── Video
            └── Quiz
```

Struktur utama PathLevel:

```text
Learning Goal
      ↓
Learning Unit
      ↓
Learning Session
```

Resource dan Note menjadi supporting material.

## 7.1 Learning Goal

Menjawab:

> "Apa yang ingin saya kuasai?"

Contoh:

```text
Backend Development
Learn Japanese
Learn Guitar
Learn Photography
Understand Personal Finance
Learn Italian Cooking
```

Goal tidak dibatasi domain teknis.

## 7.2 Learning Unit

Menjawab:

> "Bagian spesifik apa yang sedang saya pelajari dalam Goal ini?"

Contoh:

```text
Goal:
Backend Development

Units:
HTTP
REST API
Authentication
PostgreSQL
Docker
```

atau:

```text
Goal:
Learn Japanese

Units:
Hiragana
Basic Grammar
Vocabulary
Listening
Conversation
```

Unit dapat berupa konsep, skill, technology, area kompetensi, atau topik.

## 7.3 Jangan Membuat Recursive Sub-Unit untuk V1

Tidak disarankan:

```text
Backend
└── Database
    └── PostgreSQL
        └── Indexing
            └── B-Tree
```

Cukup:

```text
Learning Goal
├── Unit
├── Unit
├── Unit
└── Unit
```

Tujuannya menghindari Learning berubah menjadi knowledge tree kompleks.

## 7.4 Learning Session

Menjawab:

> "Kapan saya benar-benar melakukan aktivitas belajar?"

Contoh:

```text
SQL JOIN

Aug 10 — 45 min
Studied INNER JOIN

Aug 11 — 30 min
Practiced LEFT JOIN

Aug 12 — 50 min
Reviewed JOIN edge cases
```

Session adalah history/event, bukan target belajar.

## 7.5 Resource vs Learning Unit

Resource:

> "Dari mana saya belajar?"

Learning Unit:

> "Apa yang sedang saya coba pelajari?"

Contoh:

```text
Learning Unit:
SQL JOIN

Resources:
- YouTube SQL JOIN Explained
- PostgreSQL Documentation
- Article — Understanding JOIN
- Personal SQL JOIN Note
```

## 7.6 External Course / Bootcamp

Course tidak perlu menjadi entity utama.

```text
YouTube Bootcamp
Coursera Course
Article
PDF
```

semuanya dapat menjadi External Resource.

Contoh:

```text
YouTube Data Analyst Bootcamp
        ↓
SQL Fundamentals
```

PathLevel tidak harus mengubah setiap video menjadi Learning Unit.

Jika provider memiliki progress sendiri, progress provider dan progress PathLevel tetap dapat berbeda.

```text
Coursera:
42% course progress

PathLevel:
SQL Fundamentals — In Progress
```

## 7.7 Learning Bersifat Domain-Agnostic

Struktur yang sama dapat digunakan untuk:

```text
Programming
Language
Music
Photography
Cooking
Finance
Sports
Academic subjects
Hobbies
```

PathLevel tidak boleh mengasumsikan apa yang sedang dipelajari user.

---

# 8. Step 1D — Progress Model

Progress dipisahkan menjadi beberapa konsep.

## 8.1 Resource Progress

Menjawab:

> "Sudahkah saya menggunakan resource ini?"

```text
Not Started
In Progress
Completed
```

Resource completion tidak sama dengan Learning Unit completion.

## 8.2 Learning Unit Progress

Menjawab:

> "Apakah saya sudah menyelesaikan bagian yang ingin saya pelajari?"

Untuk V1:

```text
NOT_STARTED
IN_PROGRESS
COMPLETED
```

Progress utama berada pada Learning Unit.

User menentukan kapan Unit dianggap selesai.

## 8.3 Learning Goal Progress

Goal dapat menampilkan completion berdasarkan Unit.

```text
Backend Development

✓ HTTP
✓ REST API
◐ Authentication
○ PostgreSQL
○ Docker

2 / 5 units completed
```

```text
2 / 5 = 40%
```

Ini berarti completion terhadap struktur learning yang user definisikan, bukan 40% mastery terhadap bidang tersebut.

## 8.4 Jangan Menggunakan Jumlah Resource sebagai Learning Progress

```text
SQL JOIN

✓ YouTube
✓ Documentation
○ Article
```

Tidak berarti:

```text
2 / 3 = 67%
```

Resource adalah supporting material/evidence.

```text
Resource completed
    ≠
Learning Unit completed
```

## 8.5 Learning Session Bukan Mastery

Session dapat menghasilkan:

```text
8 sessions
5h 20m total
```

Ini adalah activity history.

Jangan mengubahnya menjadi:

```text
Mastery = 73%
```

## 8.6 Learning Summary sebagai Evidence

Contoh:

```text
SQL JOIN

3 learning sessions
2 resources reviewed

Learning Summary:
"INNER JOIN hanya mengembalikan row yang
memiliki pasangan di kedua tabel..."
```

Data tersebut dapat digunakan untuk memberikan completion suggestion, tetapi keputusan completion tetap pada user.

## 8.7 AI Tidak Menentukan Mastery

AI tidak boleh menentukan:

```text
Docker mastery = 87%
```

berdasarkan jumlah video, durasi, atau summary.

AI boleh memberikan suggestion:

```text
You've studied this topic several times.
Do you consider this unit complete?
```

## 8.8 Weighted Progress Tidak Dibutuhkan di V1

Tidak perlu:

```text
HTTP = 10%
Docker = 20%
Distributed Systems = 70%
```

Untuk V1:

> **1 Learning Unit = 1 completion unit.**

## 8.9 XP Bukan Progress

XP adalah reward.

Contoh:

```text
Complete Learning Session
+10 XP

Complete Learning Unit
+50 XP
```

XP tidak digunakan untuk menghitung mastery.

---

# 9. Empat Jenis Angka yang Harus Tetap Terpisah

### Completion

```text
3 / 5 units completed
```

Seberapa jauh struktur learning diselesaikan.

### Activity

```text
8 sessions
5h 20m
```

Seberapa banyak aktivitas belajar dilakukan.

### Resource Progress

```text
12 / 50 videos
```

Seberapa jauh user menggunakan source tertentu.

### XP

```text
+420 XP
```

Reward dari aktivitas.

Keempatnya tidak boleh dicampur.

---

# 10. Mastery Score Tidak Masuk V1

Jangan membuat:

```text
Docker
Mastery: 73%
```

Karena memberikan false precision.

Mastery di masa depan membutuhkan mekanisme yang lebih kuat, misalnya:

- assessment
- retrieval practice
- quiz
- self-assessment
- performance evidence
- spaced repetition

Mekanisme tersebut belum menjadi bagian V1.

---

# 11. Final Conceptual Domain Model

```text
                         PATHLEVEL
                             │
              ┌──────────────┴──────────────┐
              ↓                             ↓
           LIBRARY                       LEARNING
              │                             │
       ┌──────┴──────┐               Learning Goal
       ↓             ↓                      │
   Resources       Notes                    ↓
       │             │                Learning Units
       │             │                      │
       └──────┬──────┘                      │
              │                             │
              └────── linked ───────────────┘
                                            │
                                      Learning Sessions
                                            │
                                    Optional Summary
                                            │
                                            ↓
                                        Completion
                                            │
                                            ↓
                                      Goal Progress
                                            │
                                            ↓
                                            XP
```

---

# 12. Core Mental Model

### Learning

```text
LEARNING GOAL
Apa yang ingin saya kuasai?

LEARNING UNIT
Bagian apa yang sedang saya pelajari?

RESOURCE
Dari mana saya belajar?

SESSION
Kapan saya benar-benar belajar?

SUMMARY
Apa yang saya pahami setelah belajar?
```

### Library

```text
EXTERNAL RESOURCE
Apa informasi eksternal yang saya simpan?

NOTE
Apa yang saya tulis sendiri?

PERSONAL CONTEXT
Kenapa saya menyimpannya?
```

---

# 13. Keputusan Arsitektur Utama

1. Library menjadi fondasi knowledge system.
2. External Resource dan Note dipisahkan sebagai konsep domain.
3. Keduanya tetap dapat dicari melalui satu global search.
4. Inbox adalah deferred organization, bukan Todo List baru.
5. External Resource tidak dipindahkan ketika ditambahkan ke Learning.
6. Relationship Resource → Learning Unit dapat bersifat many-to-many.
7. Note juga dapat dikaitkan ke Learning Unit.
8. Learning Summary berbeda dari source summary dan personal context.
9. Learning Summary bersifat opsional.
10. Learning bersifat domain-agnostic.
11. Learning Goal → Learning Unit → Learning Session menjadi struktur utama.
12. Resource bukan Learning Unit.
13. Learning Session adalah activity history.
14. Resource completion tidak sama dengan Learning Unit completion.
15. Progress utama berasal dari completion Learning Unit.
16. Goal progress merupakan agregasi completion Unit.
17. XP adalah reward, bukan mastery.
18. Mastery score tidak digunakan pada V1.
19. AI membantu enrichment/recommendation, bukan menentukan mastery.
20. RAG dapat menjadi pengembangan masa depan setelah knowledge data cukup kaya.
21. AI/RAG harus berada di atas core domain, bukan menjadi fondasi fitur inti.
22. Core product harus tetap berfungsi tanpa AI.

---

# 14. Scope yang Sengaja Ditunda

```text
- Semantic search
- Vector database
- RAG
- AI-generated curriculum
- AI mastery scoring
- Fine-tuning
- Training model sendiri
- Knowledge graph
- Spaced repetition
- Complex assessment system
- Weighted learning progress
- External course synchronization
- Complex course importer
```

Semua dapat menjadi future exploration jika kebutuhan produk sudah terbukti.

---

# 15. Next Step

Step 1 telah menyelesaikan conceptual domain model.

Langkah berikutnya:

## Step 2 — User Flow & UX

Fokus pertama:

```text
CAPTURE
   ↓
LIBRARY / INBOX
   ↓
REVIEW / ENRICHMENT
```

Kemudian:

```text
ADD TO LEARNING
   ↓
LEARNING UNIT
   ↓
LEARNING SESSION
   ↓
OPTIONAL LEARNING SUMMARY
   ↓
COMPLETION
```

Tujuan Step 2 adalah menerjemahkan domain model menjadi workflow yang benar-benar nyaman digunakan sebelum masuk ke final data model dan implementasi.
