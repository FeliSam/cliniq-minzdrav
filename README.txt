КАРДИО ДЗМ — тренажёр к оценке квалификации кардиолога (поликлиника, приказ ДЗМ № 827)
Cardio DZM — entraîneur hors ligne pour l'évaluation de cardiologue (polyclinique, arrêté n° 827)
Version 1.3 — 01.10.2026 (106 кейсов · 742 вопроса · 30 задач) · en ligne / онлайн : https://felisam.github.io/cliniq-minzdrav/

=== FR — Comment l'ouvrir ===
1. Double-cliquer sur index.html (Chrome, Edge ou Firefox). Aucune connexion Internet n'est nécessaire : tout est local (pas de CDN).
2. La progression est enregistrée dans le navigateur (localStorage), liée au navigateur ET au dossier. Si vous changez de navigateur ou déplacez le dossier, faites d'abord « Настройки → Экспорт JSON », puis « Импорт » à l'arrivée.
3. Rappels : « Настройки → Разрешить уведомления » (fonctionne tant que la page est ouverte) + « Скачать .ics » : à importer dans le calendrier Outlook/Google/Windows (30 rappels quotidiens, 19:00 MSK par défaut, heure réglable).
4. Modes : Экзамен (100 Q / 150 min, seuil 60 %, puis 2 задачи / 40 min, seuil 60 %) — comme au vrai test ДЗМ, les 100 questions viennent de 100 cas DIFFÉRENTS (1 question tirée au hasard par cas, chacune avec sa propre vignette), réparties par domaine et mélangées ; les cas/questions déjà vus aux examens précédents passent en dernier ; Тесты (entraînement : un cas complet = 7 questions, avec explications) ; Задачи (О/Д/Л/В, 12 questions) ; Повторение (erreurs, répétition espacée SM-2) ; Банки (démo officielle Кадровый центр 50 Q + banque ФМЗА 2 908 Q, copie non officielle) ; Статистика ; План (30 jours dès le 01.10.2026, 3 examens blancs : J7, J15, J25).
5. AVERTISSEMENT : les cas cliniques et задачи ont été rédigés par une IA d'après les КР russes en vigueur (codes/années indiqués dans chaque item). Ils doivent être relus ; en cas de doute, c'est le texte officiel de la КР (cr.minzdrav.gov.ru) qui fait foi. La banque ФМЗА est une copie non officielle, en partie ancienne.

=== RU — Как открыть ===
1. Двойной щелчок по index.html (Chrome, Edge или Firefox). Интернет не нужен — все файлы локальные.
2. Прогресс хранится в браузере (localStorage) и привязан к браузеру и папке. Перед сменой браузера/компьютера: «Настройки → Экспорт JSON», затем «Импорт».
3. Напоминания: «Настройки → Разрешить уведомления» (работают, пока страница открыта) и «Скачать .ics» — импортируйте в календарь (30 ежедневных напоминаний, по умолчанию 19:00 МСК).
4. Режимы: Экзамен (100 вопросов / 150 мин, порог 60%; затем 2 задачи / 40 мин, порог 60%) — как на реальном тестировании ДЗМ, 100 вопросов из 100 РАЗНЫХ ситуаций (по 1 случайному вопросу из кейса, у каждого своё условие), с распределением по разделам и перемешиванием; ранее встречавшиеся на экзаменах кейсы/вопросы выбираются в последнюю очередь; Тесты (тренировка: кейс целиком, 7 вопросов), Задачи, Повторение ошибок (SM-2), Банки (демо Кадрового центра, банк ФМЗА — неофициальная копия), Статистика (тепловая карта 37 КР), План на 30 дней.
5. ВНИМАНИЕ: кейсы и задачи составлены с помощью ИИ по действующим КР (код, год и раздел указаны в каждом задании) и требуют экспертной проверки. При расхождении приоритет — у официального текста КР на cr.minzdrav.gov.ru.

Источники: перечень 37 КР — kadrcentr.ru (кардиология); рубрикатор КР Минздрава России; демо-тест Кадрового центра ДЗМ; банк тестов ФМЗА (неофициальная копия).
Структура: index.html · css/ · js/app.js · data/*.js (контент по темам) · screens/ (скриншоты).

Изменения 1.2: экзамен — 100 вопросов из 100 разных кейсов; все кейсы расширены до 7 вопросов; +61 новый кейс (всего 106 кейсов, 742 вопроса); выровнена длина вариантов ответа. Прогресс версии 1.1 сохраняется.
Changements 1.2 : examen = 100 questions issues de 100 cas différents ; tous les cas passent à 7 questions ; +61 nouveaux cas (106 cas, 742 questions) ; longueur des options équilibrée. La progression v1.1 est conservée.

Изменения 1.3: мобильная версия как приложение — нижняя панель вкладок (Главная, Экзамен, Тесты, Задачи, Ещё), компактная верхняя панель с таймером, нижняя панель действий (Назад / Отметить / Все вопросы / Далее), навигатор вопросов в выдвижной панели, сворачиваемые условие и анализы, свайп влево/вправо между вопросами, тёмная тема (как в системе или вручную), установка на телефон (PWA) и работа без интернета. Прогресс сохраняется.
Changements 1.3 : version mobile façon application — barre d'onglets en bas, barre du haut compacte avec minuteur, barre d'actions (Назад / Отметить / Все вопросы / Далее), navigateur des questions en panneau coulissant, vignette et analyses repliables, balayage gauche/droite entre questions, mode sombre (auto ou manuel), installation sur téléphone (PWA) et fonctionnement hors ligne. La progression est conservée.

=== Installer sur téléphone / Установка на телефон ===
iPhone (Safari) : ouvrir https://felisam.github.io/cliniq-minzdrav/ → bouton Partager (carré avec flèche) → « Sur l'écran d'accueil » → Ajouter.
Android (Chrome) : ouvrir le lien → menu ⋮ → « Installer l'application » (ou « Ajouter à l'écran d'accueil »).
Après la première ouverture en ligne, l'application fonctionne sans Internet. La progression du téléphone est séparée de celle de l'ordinateur (export/import JSON dans « Настройки » pour la transférer).
iPhone (Safari): откройте ссылку → «Поделиться» → «На экран „Домой“». Android (Chrome): меню ⋮ → «Установить приложение». После первого открытия работает офлайн. Прогресс на телефоне хранится отдельно (перенос — «Настройки → Экспорт/Импорт JSON»).
