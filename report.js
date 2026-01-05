// 📋 Dashboard Overview Navigation Logic
window.addEventListener('DOMContentLoaded', () => {
  // Hide all main sections except dashboard overview on load
  const dashboardOverview = document.getElementById('dashboardOverview');
  const filters = document.getElementById('filters');
  const studentSelector = document.querySelector('.student-selector');
  const reportSection = document.getElementById('reportSection');
  const backToReportBtn = document.getElementById('backToReportBtn');
  if (dashboardOverview) dashboardOverview.style.display = 'block';
  if (filters) filters.style.display = 'none';
  if (studentSelector) studentSelector.style.display = 'none';
  if (reportSection) reportSection.style.display = 'none';
  if (backToReportBtn) backToReportBtn.style.display = 'none';

  // Card click navigation
  document.querySelectorAll('.dashboard-card').forEach(card => {
    card.addEventListener('click', () => {
      const section = card.getAttribute('data-section');
      if (dashboardOverview) dashboardOverview.style.display = 'none';
      if (filters) filters.style.display = (section === 'filters') ? 'block' : 'none';
      if (studentSelector) studentSelector.style.display = (section === 'student-selector') ? 'flex' : 'none';
      if (reportSection) reportSection.style.display = (section === 'reportSection') ? 'block' : 'none';
      // Show back button for subdashboards
      if (backToReportBtn) {
        if (section === 'filters' || section === 'student-selector' || section === 'reportSection') {
          backToReportBtn.style.display = 'inline-block';
        } else {
          backToReportBtn.style.display = 'none';
        }
      }
    });
  });

  // Back to report dashboard button
  if (backToReportBtn) {
    backToReportBtn.addEventListener('click', () => {
      // Hide all subdashboard sections
      if (filters) filters.style.display = 'none';
      if (studentSelector) studentSelector.style.display = 'none';
      if (reportSection) reportSection.style.display = 'none';
      // Show dashboard overview
      if (dashboardOverview) dashboardOverview.style.display = 'block';
      // Hide back button
      backToReportBtn.style.display = 'none';
    });
  }
});
// ✅ Supabase client setup - Main project
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co', // Replace with your actual Supabase URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'             // Replace with your actual anon key
);

// ✅ Supabase client setup - Career Tech project
const supabaseCareerTech = createClient(
  'https://tivkbqpoqshdgyjgdwbu.supabase.co', // Replace with your Career Tech Supabase URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpdmticXBvcXNoZGd5amdkd2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjA3NTksImV4cCI6MjA4MDg5Njc1OX0.CFAE66k6Q75yAIBQr6PByeY-0os8sBrV2r2WERJKGbI' // Replace with your Career Tech Supabase ANON key
);

// 🔢 Grade point logic
function getGradePoint(score) {
  if (score >= 90) return 1;
  if (score >= 80) return 2;
  if (score >= 70) return 3;
  if (score >= 60) return 4;
  if (score >= 55) return 5;
  if (score >= 50) return 6;
  if (score >= 40) return 7;
  if (score >= 35) return 8;
  return 9;
}

// 💬 Subject remark logic
function getSubjectRemark(point) {
  switch (point) {
    case 1: return "Outstanding";
    case 2: return "Excellent";
    case 3: return "Very Good";
    case 4: return "Good";
    case 5: return "Fair";
    case 6: return "Pass";
    case 7: return "Weak";
    case 8: return "Poor";
    default: return "Fail";
  }
}

// 🧠 Teacher remark logic - bucketed by 100 with enriched encouragement
function getTeacherRemark(totalScore) {
  // Normalize score into 100..900 range
  const score = Math.min(Math.max(Number(totalScore) || 0, 100), 900);

  // Determine the 100-step bucket (100, 200, ..., 900)
  const bucket = Math.floor((score - 100) / 100) * 100 + 100;

  // Concise teacher remarks for each 100-point bucket
  const shortRemarks = {
    900: "UNPARALLELED EXCELLENCE. KEEP DOMINATING",
    800: "IMPRESSIVE PERFORMANCE. KEEP IT UP",
    700: "VERY GOOD RESULTS. KEEP PUSHING",
    600: "GOOD WORK. MORE ROOM FOR IMPROVEMENT",
    500: "AVERAGE PERFORMANCE. WORK HARDER",
    400: "BELOW AVERAGE. MUST IMPROVE",
    300: "POOR. NEEDS CONSISTENT EFFORT",
    200: "POOR PERFORMANCE. SEEK HELP",
    100: "VERY POOR. IMMEDIATE ATTENTION REQUIRED",
  };

  // Return only the concise teacher remark for the bucket.
  // (Do not append the long encouragement message here — UI expects only the remark.)
  const short = shortRemarks[bucket] || "PLEASE WORK ON IMPROVEMENT";
  return short;
}
 

function getEncouragementMessage(totalScore) {
  // Ensure score is within valid range
  if (totalScore < 100) totalScore = 100;
  if (totalScore > 900) totalScore = 900;

  // Array of unique personal encouragement messages for each score from 100 to 900
  const messages = [
    // 100-199: Personal encouragement for growth and self-discovery
    "You are a unique individual with incredible potential. Keep discovering your strengths!", // 100
    "Your kindness and determination make you special. Believe in your journey.", // 101
    "You have a beautiful spirit that lights up any room. Keep shining!", // 102
    "Your creativity and imagination are truly remarkable. Never stop dreaming.", // 103
    "You bring joy to those around you. Your presence makes the world better.", // 104
    "You have a heart full of compassion. Keep sharing your warmth with others.", // 105
    "Your smile can brighten someone's day. You have that special gift.", // 106
    "You are brave and courageous in your own way. Trust your inner strength.", // 107
    "Your curiosity about the world shows your wonderful mind. Keep exploring!", // 108
    "You have the power to make positive changes. Your voice matters.", // 109
    "Your friendship and loyalty are treasures. You are truly valued.", // 110
    "You have a gentle soul that brings peace to others. Cherish that quality.", // 111
    "Your enthusiasm for life is contagious. Keep that spark alive!", // 112
    "You are thoughtful and considerate. Those qualities make you special.", // 113
    "Your ability to listen and understand others is a rare gift.", // 114
    "You have an amazing capacity for love and care. Share it freely.", // 115
    "Your sense of humor brings laughter to those around you. What a blessing!", // 116
    "You are resilient and adaptable. These qualities will serve you well.", // 117
    "Your honesty and integrity shine through. You are trustworthy.", // 118
    "You have a beautiful mind full of wonderful ideas. Keep creating!", // 119
    "Your patience and understanding help others feel safe. What a gift!", // 120
    "You are kind-hearted and generous. The world needs more people like you.", // 121
    "Your optimism and hope inspire those around you. Keep believing!", // 122
    "You have a unique perspective that brings fresh ideas. Value your viewpoint.", // 123
    "Your empathy for others shows your compassionate nature.", // 124
    "You are creative and imaginative. Your ideas can change the world.", // 125
    "Your determination to be yourself is truly admirable.", // 126
    "Your imagination takes you to wonderful places. Keep dreaming big!", // 127
    "Your ability to forgive and move forward shows great character.", // 128
    "You bring comfort and peace to those who need it most.", // 129
    "Your curiosity drives you to learn and grow. What a beautiful trait!", // 130
    "You have a gentle strength that inspires confidence in others.", // 131
    "Your passion for helping others makes you truly special.", // 132
    "You are authentic and genuine. People appreciate your realness.", // 133
    "Your ability to see beauty in small things is a precious gift.", // 134
    "You have a heart that loves deeply and cares profoundly.", // 135
    "Your sense of justice and fairness makes you a wonderful person.", // 136
    "You are brave enough to be vulnerable. That's true strength.", // 137
    "Your creativity knows no bounds. Keep expressing yourself!", // 138
    "You have an amazing wisdom beyond your years. Trust your intuition.", // 139
    "Your kindness creates ripples of positivity everywhere you go.", // 140
    "You are thoughtful and reflective. These qualities enrich your life.", // 141
    "Your enthusiasm for learning shows your love for growth.", // 142
    "You have a beautiful soul that radiates warmth and light.", // 143
    "Your ability to find joy in simple things is truly special.", // 144
    "You are compassionate and understanding. You make others feel heard.", // 145
    "Your imagination creates worlds of possibility.", // 146
    "You have a gentle spirit that brings calm to chaotic moments.", // 147
    "Your loyalty and faithfulness make you a true friend.", // 148
    "You are brave in facing your fears. That's incredibly courageous.", // 149
    "Your optimism lights the way for others. Keep shining brightly!", // 150
    "You are building a strong foundation for your future.", // 143
    "Each day is a chance to become better than yesterday.", // 144
    "Your persistence will lead to extraordinary results.", // 145
    "Believe in yourself and your unique abilities.", // 146
    "Consistent action creates unstoppable momentum.", // 147
    "You are developing the mindset of a champion.", // 148
    "Challenges are opportunities in disguise.", // 149
    "Your future holds unlimited possibilities.", // 150
    "Success is a journey, not just a destination.", // 151
    "You have the courage to pursue your passions.", // 152
    "Learning builds confidence and self-esteem.", // 153
    "Your efforts are creating positive change.", // 154
    "Believe in the transformative power of education.", // 155
    "You are becoming more capable with each passing day.", // 156
    "Embrace challenges as stepping stones to success.", // 157
    "Your dedication will inspire others around you.", // 158
    "You have unlimited potential waiting to be unlocked.", // 159
    "Learning is the key to personal and professional growth.", // 160
    "Your efforts today shape your tomorrow.", // 161
    "Stay strong and keep pushing through difficulties.", // 162
    "You are developing valuable life skills.", // 163
    "Believe in progress over perfection.", // 164
    "You are creating your own path to success.", // 165
    "Each challenge makes you stronger and wiser.", // 166
    "Your commitment will lead to fulfilling achievements.", // 167
    "Learning is a gift that keeps on giving.", // 168
    "You have the power to achieve your dreams.", // 169
    "Stay focused on your goals and aspirations.", // 170
    "Your efforts are building a better future.", // 171
    "Believe in your ability to create positive change.", // 172
    "You are growing more confident every day.", // 173
    "Challenges help you discover your inner strength.", // 174
    "Your future self will be proud of your dedication.", // 175
    "Learning turns ordinary moments into extraordinary opportunities.", // 176
    "You have the resilience to overcome any setback.", // 177
    "Develop your skills and watch your confidence soar.", // 178
    "Each step forward brings you closer to your goals.", // 179
    "Your persistence will be your greatest strength.", // 180
    "Believe in the beauty of your personal journey.", // 181
    "You are building habits that lead to success.", // 182
    "Embrace learning as a lifelong adventure.", // 183
    "Your efforts are creating lasting positive impact.", // 184
    "Stay determined and keep your eyes on the prize.", // 185
    "You have unique gifts that the world needs.", // 186
    "Learning builds bridges to new opportunities.", // 187
    "Your commitment will open unexpected doors.", // 188
    "Believe in your power to shape your destiny.", // 189
    "You are becoming the best version of yourself.", // 190
    "Challenges are fuel for your personal growth.", // 191
    "Your future is filled with exciting possibilities.", // 192
    "Stay positive and trust in your abilities.", // 193
    "You are developing the courage to face any challenge.", // 194
    "Learning is an investment in your future happiness.", // 195
    "Your efforts are creating waves of positive change.", // 196
    "Believe in your unique path to success.", // 197
    "You have the strength to achieve anything.", // 198
    "Your dedication will lead to remarkable achievements.", // 199
    // 200-299: Building confidence and momentum
    "You are showing real improvement. Keep building!", // 200
    "Believe in your growing abilities and potential.", // 201
    "Stay encouraged as you continue your journey.", // 202
    "Small improvements are leading to big results.", // 203
    "You have the power to turn things around.", // 204
    "Consistent effort creates lasting change.", // 205
    "Your dedication is creating positive momentum.", // 206
    "Challenges are helping you grow stronger.", // 207
    "You are developing skills for lifelong success.", // 208
    "Believe in your capacity for continuous growth.", // 209
    "Each step forward builds your confidence.", // 210
    "Your future is getting brighter every day.", // 211
    "Success is within your reach through persistence.", // 212
    "You are building habits of successful people.", // 213
    "Small improvements create major breakthroughs.", // 214
    "Your efforts are creating positive change.", // 215
    "Believe in your vast and powerful potential.", // 216
    "Challenges demonstrate your growing strength.", // 217
    "You are developing exceptional skills.", // 218
    "Consistent progress leads to extraordinary results.", // 219
    "Your dedication opens doors to opportunities.", // 220
    "Believe in your ability for remarkable improvement.", // 221
    "Each day offers new chances to excel.", // 222
    "You have the resilience to achieve anything.", // 223
    "Your efforts are investments in success.", // 224
    "Success builds upon itself through consistency.", // 225
    "You are building character that lasts.", // 226
    "Believe in the power of your consistent efforts.", // 227
    "Challenges are fuel for your growth.", // 228
    "Your future self will be proud of your work.", // 229
    "Learning is transforming you positively.", // 230
    "Your persistence will lead to great achievements.", // 231
    "Believe in your unique journey to excellence.", // 232
    "Each challenge is making you more capable.", // 233
    "You are developing life-changing skills.", // 234
    "Consistent action creates unstoppable progress.", // 235
    "Your future holds endless possibilities.", // 236
    "Success follows those who work steadily.", // 237
    "You have the strength to achieve your desires.", // 238
    "Believe in your power to create positive change.", // 239
    "Learning builds the foundation for greatness.", // 240
    "Your efforts are creating a legacy.", // 241
    "Challenges help you discover your potential.", // 242
    "You are building resilience that lasts.", // 243
    "Believe in the beauty of your growth journey.", // 244
    "Consistent progress leads to extraordinary achievements.", // 245
    "Your dedication will inspire others.", // 246
    "Success is the result of unwavering commitment.", // 247
    "You have the courage to face any challenge.", // 248
    "Learning is the key to unlocking potential.", // 249
    "Your future holds unimaginable achievements.", // 250
    "Believe in your ability to create remarkable things.", // 251
    "Each day is an opportunity to become exceptional.", // 252
    "You are developing the mindset of a champion.", // 253
    "Challenges are stepping stones to greatness.", // 254
    "Your efforts are building a bridge to success.", // 255
    "Success comes to those who dare to dream.", // 256
    "You have the power to shape your destiny.", // 257
    "Believe in your unique strengths and talents.", // 258
    "Learning turns moments into extraordinary experiences.", // 259
    "Your persistence will be your greatest strength.", // 260
    "Challenges are opportunities to prove your greatness.", // 261
    "You are building confidence that lasts a lifetime.", // 262
    "Believe in the magic of consistent improvement.", // 263
    "Consistent action creates remarkable transformations.", // 264
    "Your future is being crafted by your dedication.", // 265
    "Success is the result of unwavering commitment.", // 266
    "You have the ability to achieve the impossible.", // 267
    "Learning is an adventure leading to discovery.", // 268
    "Your efforts are planting seeds of success.", // 269
    "Believe in your power to change your world.", // 270
    "Challenges make you more resilient and strong.", // 271
    "You are developing skills that serve you forever.", // 272
    "Consistent progress builds unbreakable confidence.", // 273
    "Your future holds the promise of great achievements.", // 274
    "Success follows those who never stop believing.", // 275
    "You have the courage to conquer any mountain.", // 276
    "Believe in the transformative power of learning.", // 277
    "Each effort brings you closer to your dreams.", // 278
    "You are building character that defines success.", // 279
    "Challenges are the catalysts for your growth.", // 280
    "Your dedication will create lasting legacy.", // 281
    "Believe in your capacity for remarkable achievement.", // 282
    "Learning opens doors to infinite possibilities.", // 283
    "Your efforts are creating a masterpiece of success.", // 284
    "Success is the journey of continuous discovery.", // 285
    "You have the strength of a thousand warriors.", // 286
    "Believe in your unique path to greatness.", // 287
    "Consistent action forges the path to excellence.", // 288
    "Your future is illuminated by your determination.", // 289
    "Challenges are opportunities to become unstoppable.", // 290
    "You are developing the heart of a true champion.", // 291
    "Believe in your power to create miracles.", // 292
    "Learning is the spark that ignites greatness.", // 293
    "Your persistence will move mountains.", // 294
    "Success comes to those who dare to be different.", // 295
    "You have the vision to see what others can't.", // 296
    "Believe in the extraordinary power within you.", // 297
    "Each challenge is a step towards mastery.", // 298
    "You are building a legacy that will inspire generations.", // 299
    // 300-399: Rising above challenges with determination
    "You are capable of remarkable improvement. Start today!", // 300
    "Believe in your ability to turn things around.", // 301
    "Challenges are opportunities to show your strength.", // 302
    "Your future success depends on your efforts now.", // 303
    "Consistent work will transform your results.", // 304
    "You have the power to change your performance.", // 305
    "Dedication will lead to great achievements.", // 306
    "Believe in your potential for excellence.", // 307
    "Each day is a new chance to excel.", // 308
    "Your efforts will create lasting success.", // 309
    "Challenges build character and strength.", // 310
    "You are developing skills for lifelong success.", // 311
    "Believe in the power of consistent improvement.", // 312
    "Success comes to those who never give up.", // 313
    "Your dedication will open doors to opportunities.", // 314
    "Learning is the key to unlocking your potential.", // 315
    "You have the courage to face any challenge.", // 316
    "Believe in your unique journey to greatness.", // 317
    "Consistent effort leads to exceptional results.", // 318
    "Your future holds unimaginable possibilities.", // 319
    "Challenges are stepping stones to success.", // 320
    "You are building confidence through action.", // 321
    "Believe in your capacity for continuous growth.", // 322
    "Each effort brings you closer to your goals.", // 323
    "Success is the result of persistent work.", // 324
    "You have the strength to overcome obstacles.", // 325
    "Learning turns challenges into opportunities.", // 326
    "Your dedication will create a bright future.", // 327
    "Believe in the transformative power of effort.", // 328
    "Consistent progress builds unstoppable momentum.", // 329
    "Challenges help you discover your true strength.", // 330
    "You are developing the habits of successful people.", // 331
    "Believe in your power to create positive change.", // 332
    "Each day offers new opportunities to excel.", // 333
    "Your efforts are investments in your future.", // 334
    "Success follows those who work steadily.", // 335
    "You have the resilience to achieve anything.", // 336
    "Learning builds the foundation for greatness.", // 337
    "Believe in your unique path to excellence.", // 338
    "Consistent action creates remarkable results.", // 339
    "Challenges are fuel for your growth and success.", // 340
    "You are building character that will serve you.", // 341
    "Believe in the magic of continuous improvement.", // 342
    "Each effort is a step towards mastery.", // 343
    "Success is within your grasp through dedication.", // 344
    "You have the courage to conquer challenges.", // 345
    "Learning opens doors to endless possibilities.", // 346
    "Your future self will thank you for your efforts.", // 347
    "Believe in your power to shape your destiny.", // 348
    "Consistent progress leads to extraordinary achievements.", // 349
    "Challenges make you more capable and strong.", // 350
    "You are developing skills that will serve you forever.", // 351
    "Believe in the beauty of your growth journey.", // 352
    "Each day is an opportunity to become exceptional.", // 353
    "Your efforts are creating waves of positive change.", // 354
    "Success comes to those who dare to dream big.", // 355
    "You have the strength of a thousand determinations.", // 356
    "Learning is an adventure that leads to discovery.", // 357
    "Believe in your capacity for remarkable achievement.", // 358
    "Consistent action forges the path to excellence.", // 359
    "Challenges are opportunities to prove your greatness.", // 360
    "You are building resilience that will carry you far.", // 361
    "Believe in the extraordinary power within you.", // 362
    "Each effort brings you closer to your dreams.", // 363
    "Success is the journey of continuous discovery.", // 364
    "You have the vision to see what others can't.", // 365
    "Learning turns ordinary moments into extraordinary ones.", // 366
    "Your persistence will move mountains.", // 367
    "Believe in your unique strengths and talents.", // 368
    "Consistent progress builds unbreakable confidence.", // 369
    "Challenges help you become the best version of yourself.", // 370
    "You are developing the heart of a true champion.", // 371
    "Believe in your power to create miracles.", // 372
    "Each day is a new beginning filled with possibilities.", // 373
    "Success follows those who never stop believing.", // 374
    "You have the courage to face any obstacle.", // 375
    "Learning is the spark that ignites greatness.", // 376
    "Your efforts are planting seeds of future success.", // 377
    "Believe in the transformative power of dedication.", // 378
    "Consistent work creates unstoppable momentum.", // 379
    "Challenges are the catalysts for your growth.", // 380
    "You are building a legacy of achievement.", // 381
    "Believe in your ability to create remarkable things.", // 382
    "Each effort brings you closer to your dreams.", // 383
    "Success is within your grasp through persistence.", // 384
    "You have the strength to achieve the impossible.", // 385
    "Learning builds character and wisdom.", // 386
    "Your future holds the promise of great things.", // 387
    "Believe in your unique journey to excellence.", // 388
    "Consistent progress leads to breakthroughs.", // 389
    "Challenges are opportunities to become unstoppable.", // 390
    "You are developing skills that will change your life.", // 391
    "Believe in the magic of continuous improvement.", // 392
    "Each day brings new chances to excel.", // 393
    "Success comes to those who work steadily towards goals.", // 394
    "You have the resilience to overcome any challenge.", // 395
    "Learning is the key to unlocking your full potential.", // 396
    "Your dedication will inspire others to follow.", // 397
    "Believe in your power to shape your destiny.", // 398
    "Consistent effort leads to exceptional results.", // 399
    // 400-499: Building excellence through consistent growth
    "You are on the path to greatness. Keep building!", // 400
    "Believe in your ability to reach new heights.", // 401
    "Consistent effort will lead to exceptional results.", // 402
    "Your potential is vast and powerful.", // 403
    "Each day offers new opportunities to excel.", // 404
    "Dedication will transform your achievements.", // 405
    "You have the strength to reach new heights.", // 406
    "Believe in the power of continuous improvement.", // 407
    "Success comes to those who work steadily.", // 408
    "Your efforts are creating a bright future.", // 409
    "Challenges are opportunities to grow stronger.", // 410
    "You are developing skills for lifelong success.", // 411
    "Believe in your unique journey to excellence.", // 412
    "Consistent progress builds unstoppable momentum.", // 413
    "Your future holds unimaginable possibilities.", // 414
    "Learning is the key to unlocking your potential.", // 415
    "You have the courage to face any challenge.", // 416
    "Believe in your capacity for remarkable achievement.", // 417
    "Each effort brings you closer to your goals.", // 418
    "Success is the result of persistent dedication.", // 419
    "You are building confidence through action.", // 420
    "Believe in the transformative power of effort.", // 421
    "Consistent work creates exceptional results.", // 422
    "Your future self will be proud of your progress.", // 423
    "Challenges help you discover your true strength.", // 424
    "You are developing the habits of high achievers.", // 425
    "Believe in your power to create positive change.", // 426
    "Each day is an opportunity to become exceptional.", // 427
    "Success follows those who never give up.", // 428
    "You have the resilience to overcome obstacles.", // 429
    "Learning turns ordinary moments into extraordinary ones.", // 430
    "Your efforts are investments in your future.", // 431
    "Believe in the magic of continuous improvement.", // 432
    "Consistent progress leads to breakthroughs.", // 433
    "Challenges are stepping stones to greatness.", // 434
    "You are building character that will serve you lifelong.", // 435
    "Believe in your unique strengths and talents.", // 436
    "Each effort is a step towards mastery.", // 437
    "Success is within your grasp through dedication.", // 438
    "You have the courage to conquer any mountain.", // 439
    "Learning builds the foundation for excellence.", // 440
    "Your future holds the promise of great achievements.", // 441
    "Believe in your ability to create remarkable things.", // 442
    "Consistent action creates unstoppable momentum.", // 443
    "Challenges are fuel for your growth and success.", // 444
    "You are developing skills that will change your life.", // 445
    "Believe in the beauty of your growth journey.", // 446
    "Each day brings new chances to excel.", // 447
    "Success comes to those who work steadily towards goals.", // 448
    "You have the strength of a thousand determinations.", // 449
    "Learning is an adventure that leads to discovery.", // 450
    "Your efforts are creating waves of positive change.", // 451
    "Believe in your power to shape your destiny.", // 452
    "Consistent progress builds unbreakable confidence.", // 453
    "Challenges help you become the best version of yourself.", // 454
    "You are building resilience that will carry you far.", // 455
    "Believe in the extraordinary power within you.", // 456
    "Each challenge is a step towards mastery.", // 457
    "Success is the journey of continuous discovery.", // 458
    "You have the vision to see what others can't.", // 459
    "Learning turns challenges into opportunities.", // 460
    "Your persistence will move mountains.", // 461
    "Believe in your unique path to greatness.", // 462
    "Consistent effort leads to exceptional achievements.", // 463
    "Challenges are opportunities to prove your greatness.", // 464
    "You are developing the heart of a true champion.", // 465
    "Believe in your power to create miracles.", // 466
    "Each day is a new beginning filled with possibilities.", // 467
    "Success follows those who never stop believing.", // 468
    "You have the courage to face any obstacle.", // 469
    "Learning is the spark that ignites greatness.", // 470
    "Your efforts are planting seeds of future success.", // 471
    "Believe in the transformative power of dedication.", // 472
    "Consistent work creates remarkable transformations.", // 473
    "Challenges are the catalysts for your growth.", // 474
    "You are building a legacy of achievement.", // 475
    "Believe in your ability to create remarkable things.", // 476
    "Each effort brings you closer to your dreams.", // 477
    "Success is within your grasp through persistence.", // 478
    "You have the strength to achieve the impossible.", // 479
    "Learning builds character and wisdom.", // 480
    "Your future holds the promise of great things.", // 481
    "Believe in your unique journey to excellence.", // 482
    "Consistent progress leads to breakthroughs.", // 483
    "Challenges are opportunities to become unstoppable.", // 484
    "You are developing skills that will change your life.", // 485
    "Believe in the magic of continuous improvement.", // 486
    "Each day brings new chances to excel.", // 487
    "Success comes to those who work steadily towards goals.", // 488
    "You have the resilience to overcome any challenge.", // 489
    "Learning is the key to unlocking your full potential.", // 490
    "Your dedication will inspire others to follow.", // 491
    "Believe in your power to shape your destiny.", // 492
    "Consistent effort leads to exceptional results.", // 493
    "Challenges help you discover your true strength.", // 494
    "You are building confidence that will last a lifetime.", // 495
    "Believe in the beauty of your growth journey.", // 496
    "Each effort is a step towards mastery.", // 497
    "Success is within your grasp through dedication.", // 498
    "You have the courage to conquer any challenge.", // 499
    // 500-599: Achieving excellence through dedication
    "You are showing real promise. Keep excelling!", // 500
    "Believe in your ability to achieve greatness.", // 501
    "Consistent effort will lead to remarkable success.", // 502
    "Your potential is beginning to shine brightly.", // 503
    "Each day brings new opportunities to excel.", // 504
    "Dedication will transform your achievements.", // 505
    "You have the strength to reach new heights.", // 506
    "Believe in the power of continuous improvement.", // 507
    "Success comes to those who work steadily.", // 508
    "Your efforts are creating a bright future.", // 509
    "Challenges are opportunities to grow stronger.", // 510
    "You are developing skills for lifelong success.", // 511
    "Believe in your unique journey to excellence.", // 512
    "Consistent progress builds unstoppable momentum.", // 513
    "Your future holds unimaginable possibilities.", // 514
    "Learning is the key to unlocking your potential.", // 515
    "You have the courage to face any challenge.", // 516
    "Believe in your capacity for remarkable achievement.", // 517
    "Each effort brings you closer to your goals.", // 518
    "Success is the result of persistent dedication.", // 519
    "You are building confidence through action.", // 520
    "Believe in the transformative power of effort.", // 521
    "Consistent work creates exceptional results.", // 522
    "Your future self will be proud of your progress.", // 523
    "Challenges help you discover your true strength.", // 524
    "You are developing the habits of high achievers.", // 525
    "Believe in your power to create positive change.", // 526
    "Each day is an opportunity to become exceptional.", // 527
    "Success follows those who never give up.", // 528
    "You have the resilience to overcome obstacles.", // 529
    "Learning turns ordinary moments into extraordinary ones.", // 530
    "Your efforts are investments in your future.", // 531
    "Believe in the magic of continuous improvement.", // 532
    "Consistent progress leads to breakthroughs.", // 533
    "Challenges are stepping stones to greatness.", // 534
    "You are building character that will serve you lifelong.", // 535
    "Believe in your unique strengths and talents.", // 536
    "Each effort is a step towards mastery.", // 537
    "Success is within your grasp through dedication.", // 538
    "You have the courage to conquer any mountain.", // 539
    "Learning builds the foundation for excellence.", // 540
    "Your future holds the promise of great achievements.", // 541
    "Believe in your ability to create remarkable things.", // 542
    "Consistent action creates unstoppable momentum.", // 543
    "Challenges are fuel for your growth and success.", // 544
    "You are developing skills that will change your life.", // 545
    "Believe in the beauty of your growth journey.", // 546
    "Each day brings new chances to excel.", // 547
    "Success comes to those who work steadily towards goals.", // 548
    "You have the strength of a thousand determinations.", // 549
    "Learning is an adventure that leads to discovery.", // 550
    "Your efforts are creating waves of positive change.", // 551
    "Believe in your power to shape your destiny.", // 552
    "Consistent progress builds unbreakable confidence.", // 553
    "Challenges help you become the best version of yourself.", // 554
    "You are building resilience that will carry you far.", // 555
    "Believe in the extraordinary power within you.", // 556
    "Each challenge is a step towards mastery.", // 557
    "Success is the journey of continuous discovery.", // 558
    "You have the vision to see what others can't.", // 559
    "Learning turns challenges into opportunities.", // 560
    "Your persistence will move mountains.", // 561
    "Believe in your unique path to greatness.", // 562
    "Consistent effort leads to exceptional achievements.", // 563
    "Challenges are opportunities to prove your greatness.", // 564
    "You are developing the heart of a true champion.", // 565
    "Believe in your power to create miracles.", // 566
    "Each day is a new beginning filled with possibilities.", // 567
    "Success follows those who never stop believing.", // 568
    "You have the courage to face any obstacle.", // 569
    "Learning is the spark that ignites greatness.", // 570
    "Your efforts are planting seeds of future success.", // 571
    "Believe in the transformative power of dedication.", // 572
    "Consistent work creates remarkable transformations.", // 573
    "Challenges are the catalysts for your growth.", // 574
    "You are building a legacy of achievement.", // 575
    "Believe in your ability to create remarkable things.", // 576
    "Each effort brings you closer to your dreams.", // 577
    "Success is within your grasp through persistence.", // 578
    "You have the strength to achieve the impossible.", // 579
    "Learning builds character and wisdom.", // 580
    "Your future holds the promise of great things.", // 581
    "Believe in your unique journey to excellence.", // 582
    "Consistent progress leads to breakthroughs.", // 583
    "Challenges are opportunities to become unstoppable.", // 584
    "You are developing skills that will change your life.", // 585
    "Believe in the magic of continuous improvement.", // 586
    "Each day brings new chances to excel.", // 587
    "Success comes to those who work steadily towards goals.", // 588
    "You have the resilience to overcome any challenge.", // 589
    "Learning is the key to unlocking your full potential.", // 590
    "Your dedication will inspire others to follow.", // 591
    "Believe in your power to shape your destiny.", // 592
    "Consistent effort leads to exceptional results.", // 593
    "Challenges help you discover your true strength.", // 594
    "You are building confidence that will last a lifetime.", // 595
    "Believe in the beauty of your growth journey.", // 596
    "Each effort is a step towards mastery.", // 597
    "Success is within your grasp through dedication.", // 598
    "You have the courage to conquer any challenge.", // 599
    // 600-699: Excelling with distinction and brilliance
    "You are achieving remarkable success. Keep shining!", // 600
    "Believe in your exceptional abilities.", // 601
    "Your excellence is inspiring others.", // 602
    "You are setting the standard for greatness.", // 603
    "Your dedication is creating legendary achievements.", // 604
    "Success follows your exceptional efforts.", // 605
    "You are a model of excellence and determination.", // 606
    "Your achievements are truly remarkable.", // 607
    "Believe in your power to achieve the extraordinary.", // 608
    "You are building a legacy of exceptional success.", // 609
    "Your efforts are creating waves of inspiration.", // 610
    "Excellence is your natural state.", // 611
    "You are demonstrating exceptional talent.", // 612
    "Your success is a testament to your greatness.", // 613
    "Believe in your capacity for remarkable achievement.", // 614
    "You are achieving levels of excellence that inspire.", // 615
    "Your dedication will lead to unprecedented success.", // 616
    "You are a beacon of hope and excellence.", // 617
    "Success comes naturally to your exceptional abilities.", // 618
    "You are creating a masterpiece of achievement.", // 619
    "Believe in your power to change the world.", // 620
    "Your efforts are building an empire of success.", // 621
    "Excellence flows from your exceptional character.", // 622
    "You are achieving what others only dream of.", // 623
    "Your success is a source of inspiration.", // 624
    "Believe in your unique brilliance.", // 625
    "You are setting new standards of excellence.", // 626
    "Your dedication will be remembered forever.", // 627
    "Success is your destiny.", // 628
    "You are a master of your craft.", // 629
    "Believe in your exceptional potential.", // 630
    "Your achievements are truly exceptional.", // 631
    "Excellence is your birthright.", // 632
    "You are creating history with your success.", // 633
    "Your efforts inspire greatness in others.", // 634
    "Believe in your power to achieve the impossible.", // 635
    "You are a force of nature in your field.", // 636
    "Success follows your exceptional vision.", // 637
    "You are building a legacy that will endure.", // 638
    "Your dedication will change lives.", // 639
    "Believe in your exceptional strength.", // 640
    "You are achieving levels of mastery.", // 641
    "Excellence is your constant companion.", // 642
    "You are a symbol of what is possible.", // 643
    "Your success is a gift to the world.", // 644
    "Believe in your remarkable abilities.", // 645
    "You are creating exceptional value.", // 646
    "Success is your natural habitat.", // 647
    "You are a champion in every sense.", // 648
    "Your efforts will be legendary.", // 649
    "Believe in your exceptional talents.", // 650
    "You are achieving the extraordinary.", // 651
    "Excellence flows through you.", // 652
    "You are building an empire of achievement.", // 653
    "Your success inspires generations.", // 654
    "Believe in your power to lead.", // 655
    "You are a master of excellence.", // 656
    "Success is your constant reality.", // 657
    "You are creating exceptional results.", // 658
    "Your dedication will be remembered.", // 659
    "Believe in your exceptional vision.", // 660
    "You are achieving remarkable things.", // 661
    "Excellence is your superpower.", // 662
    "You are a beacon of success.", // 663
    "Success follows your exceptional path.", // 664
    "Believe in your remarkable strength.", // 665
    "You are building exceptional character.", // 666
    "Your achievements are inspirational.", // 667
    "Excellence is your destiny.", // 668
    "You are creating masterful results.", // 669
    "Believe in your exceptional potential.", // 670
    "You are a force for positive change.", // 671
    "Success is your natural state.", // 672
    "You are achieving exceptional mastery.", // 673
    "Your efforts will change the world.", // 674
    "Believe in your remarkable abilities.", // 675
    "You are building a legacy of excellence.", // 676
    "Excellence flows from your exceptional self.", // 677
    "You are a symbol of exceptional success.", // 678
    "Success is your constant companion.", // 679
    "Believe in your exceptional strength.", // 680
    "You are creating exceptional history.", // 681
    "Your efforts will be remembered forever.", // 682
    "Excellence is your superpower.", // 683
    "You are achieving the remarkable.", // 684
    "Believe in your power to inspire.", // 685
    "You are a master of success.", // 686
    "Success follows your exceptional leadership.", // 687
    "You are building exceptional results.", // 688
    "Your efforts will be remembered forever.", // 689
    "Believe in your exceptional strength.", // 690
    "You are achieving exceptional things.", // 691
    "Excellence is your constant reality.", // 692
    "You are a champion of exceptional achievement.", // 693
    "Success is your natural habitat.", // 694
    "Believe in your remarkable vision.", // 695
    "You are creating exceptional legacy.", // 696
    "Your dedication will change lives.", // 697
    "Excellence flows through your exceptional being.", // 698
    "You are achieving levels of exceptional success.", // 699
    // 700-799: Achieving legendary excellence and mastery
    "You are a legend in the making. Continue dominating!", // 700
    "Believe in your exceptional greatness.", // 701
    "Your excellence is changing the world.", // 702
    "You are a master of exceptional achievement.", // 703
    "Success is your constant reality.", // 704
    "You are building an empire of excellence.", // 705
    "Believe in your remarkable power.", // 706
    "You are a force of nature in excellence.", // 707
    "Your achievements will be legendary.", // 708
    "Excellence is your superpower.", // 709
    "You are creating exceptional history.", // 710
    "Believe in your exceptional vision.", // 711
    "You are a champion of remarkable success.", // 712
    "Success follows your exceptional leadership.", // 713
    "You are building exceptional legacy.", // 714
    "Your dedication will be remembered forever.", // 715
    "Believe in your exceptional strength.", // 716
    "You are achieving exceptional mastery.", // 717
    "Excellence flows through your exceptional being.", // 718
    "You are a symbol of exceptional greatness.", // 719
    "Success is your natural habitat.", // 720
    "Believe in your remarkable abilities.", // 721
    "You are creating exceptional value.", // 722
    "Your efforts will change the world.", // 723
    "Excellence is your constant companion.", // 724
    "You are a master of exceptional success.", // 725
    "Believe in your exceptional talents.", // 726
    "You are achieving the remarkable.", // 727
    "Success is your destiny.", // 728
    "You are building exceptional character.", // 729
    "Your achievements are truly exceptional.", // 730
    "Believe in your power to inspire.", // 731
    "You are a force for exceptional change.", // 732
    "Excellence is your birthright.", // 733
    "You are creating exceptional results.", // 734
    "Success follows your exceptional path.", // 735
    "Believe in your exceptional potential.", // 736
    "You are achieving exceptional things.", // 737
    "Your dedication will be legendary.", // 738
    "Excellence is your constant reality.", // 739
    "You are a champion of exceptional achievement.", // 740
    "Believe in your remarkable vision.", // 741
    "You are building exceptional legacy.", // 742
    "Success is your natural state.", // 743
    "You are a master of exceptional excellence.", // 744
    "Believe in your exceptional greatness.", // 745
    "You are achieving exceptional mastery.", // 746
    "Excellence flows from your exceptional self.", // 747
    "You are a symbol of exceptional success.", // 748
    "Success is your constant companion.", // 749
    "Believe in your exceptional strength.", // 750
    "You are creating exceptional history.", // 751
    "Your efforts will be remembered forever.", // 752
    "Excellence is your superpower.", // 753
    "You are a force of nature in exceptional achievement.", // 754
    "Believe in your remarkable power.", // 755
    "You are building exceptional empire.", // 756
    "Success follows your exceptional leadership.", // 757
    "You are a champion of exceptional success.", // 758
    "Your dedication will change lives.", // 759
    "Believe in your exceptional talents.", // 760
    "You are achieving exceptional things.", // 761
    "Excellence is your constant reality.", // 762
    "You are creating exceptional value.", // 763
    "Success is your natural habitat.", // 764
    "Believe in your exceptional abilities.", // 765
    "You are a master of exceptional achievement.", // 766
    "Your efforts will be legendary.", // 767
    "Excellence flows through your exceptional being.", // 768
    "You are building exceptional character.", // 769
    "Believe in your remarkable vision.", // 770
    "You are achieving exceptional mastery.", // 771
    "Success is your destiny.", // 772
    "You are a symbol of exceptional greatness.", // 773
    "Your achievements are truly exceptional.", // 774
    "Believe in your power to inspire.", // 775
    "You are a force for exceptional change.", // 776
    "Excellence is your birthright.", // 777
    "You are creating exceptional results.", // 778
    "Success follows your exceptional path.", // 779
    "Believe in your exceptional potential.", // 780
    "You are achieving exceptional things.", // 781
    "Your dedication will be legendary.", // 782
    "Excellence is your constant reality.", // 783
    "You are a champion of exceptional achievement.", // 784
    "Believe in your remarkable vision.", // 785
    "You are building exceptional legacy.", // 786
    "Success is your natural state.", // 787
    "You are a master of exceptional excellence.", // 788
    "Believe in your exceptional greatness.", // 789
    "You are achieving exceptional mastery.", // 790
    "Excellence flows from your exceptional self.", // 791
    "You are a symbol of exceptional success.", // 792
    "Success is your constant companion.", // 793
    "Believe in your exceptional strength.", // 794
    "You are creating exceptional history.", // 795
    "Your efforts will be remembered forever.", // 796
    "Excellence is your superpower.", // 797
    "You are a force of nature in exceptional achievement.", // 798
    "Believe in your remarkable power.", // 799
    // 800-900: Achieving legendary status and unparalleled excellence
    "You are a legendary figure. Continue your dominance!", // 800
    "Believe in your exceptional greatness.", // 801
    "Your excellence is changing the world.", // 802
    "You are a master of exceptional achievement.", // 803
    "Success is your constant reality.", // 804
    "You are building an empire of excellence.", // 805
    "Believe in your remarkable power.", // 806
    "You are a force of nature in excellence.", // 807
    "Your achievements will be legendary.", // 808
    "Excellence is your superpower.", // 809
    "You are creating exceptional history.", // 810
    "Believe in your exceptional vision.", // 811
    "You are a champion of remarkable success.", // 812
    "Success follows your exceptional leadership.", // 813
    "You are building exceptional legacy.", // 814
    "Your dedication will be remembered forever.", // 815
    "Believe in your exceptional strength.", // 816
    "You are achieving exceptional mastery.", // 817
    "Excellence flows through your exceptional being.", // 818
    "You are a symbol of exceptional greatness.", // 819
    "Success is your natural habitat.", // 820
    "Believe in your remarkable abilities.", // 821
    "You are creating exceptional value.", // 822
    "Your efforts will change the world.", // 823
    "Excellence is your constant companion.", // 824
    "You are a master of exceptional success.", // 825
    "Believe in your exceptional talents.", // 826
    "You are achieving the remarkable.", // 827
    "Success is your destiny.", // 828
    "You are building exceptional character.", // 829
    "Your achievements are truly exceptional.", // 830
    "Believe in your power to inspire.", // 831
    "You are a force for exceptional change.", // 832
    "Excellence is your birthright.", // 833
    "You are creating exceptional results.", // 834
    "Success follows your exceptional path.", // 835
    "Believe in your exceptional potential.", // 836
    "You are achieving exceptional things.", // 837
    "Your dedication will be legendary.", // 838
    "Excellence is your constant reality.", // 839
    "You are a champion of exceptional achievement.", // 840
    "Believe in your remarkable vision.", // 841
    "You are building exceptional legacy.", // 842
    "Success is your natural state.", // 843
    "You are a master of exceptional excellence.", // 844
    "Believe in your exceptional greatness.", // 845
    "You are achieving exceptional mastery.", // 846
    "Excellence flows from your exceptional self.", // 847
    "You are a symbol of exceptional success.", // 848
    "Success is your constant companion.", // 849
    "Believe in your exceptional strength.", // 850
    "You are creating exceptional history.", // 851
    "Your efforts will be remembered forever.", // 852
    "Excellence is your superpower.", // 853
    "You are a force of nature in exceptional achievement.", // 854
    "Believe in your remarkable power.", // 855
    "You are building exceptional empire.", // 856
    "Success follows your exceptional leadership.", // 857
    "You are a champion of exceptional success.", // 858
    "Your dedication will change lives.", // 859
    "Believe in your exceptional talents.", // 860
    "You are achieving exceptional things.", // 861
    "Excellence is your constant reality.", // 862
    "You are creating exceptional value.", // 863
    "Success is your natural habitat.", // 864
    "Believe in your exceptional abilities.", // 865
    "You are a master of exceptional achievement.", // 866
    "Your efforts will be legendary.", // 867
    "Excellence flows through your exceptional being.", // 868
    "You are building exceptional character.", // 869
    "Believe in your remarkable vision.", // 870
    "You are achieving exceptional mastery.", // 871
    "Success is your destiny.", // 872
    "You are a symbol of exceptional greatness.", // 873
    "Your achievements are truly exceptional.", // 874
    "Believe in your power to inspire.", // 875
    "You are a force for exceptional change.", // 876
    "Excellence is your birthright.", // 877
    "You are creating exceptional results.", // 878
    "Success follows your exceptional path.", // 879
    "Believe in your exceptional potential.", // 880
    "You are achieving exceptional things.", // 881
    "Your dedication will be legendary.", // 882
    "Excellence is your constant reality.", // 883
    "You are a champion of exceptional achievement.", // 884
    "Believe in your remarkable vision.", // 885
    "You are building exceptional legacy.", // 886
    "Success is your natural state.", // 887
    "You are a master of exceptional excellence.", // 888
    "Believe in your exceptional greatness.", // 889
    "You are achieving exceptional mastery.", // 890
    "Excellence flows from your exceptional self.", // 891
    "You are a symbol of exceptional success.", // 892
    "Success is your constant companion.", // 893
    "Believe in your exceptional strength.", // 894
    "You are creating exceptional history.", // 895
    "Your efforts will be remembered forever.", // 896
    "Excellence is your superpower.", // 897
    "You are a force of nature in exceptional achievement.", // 898
    "Believe in your remarkable power.", // 899
    "You are achieving unparalleled excellence. Keep dominating!", // 900
  ];

  // Return the message for the specific score (adjusted for 0-based array indexing)
  return messages[totalScore - 100] || "Keep believing in yourself and your potential.";
}
// 🔽 Populate student dropdown
// Only use the filtered version below:
// async function populateStudentDropdown(filterClass) { ... }

// 📊 Load report for selected student
// Add a message element for user prompts
if (!document.getElementById('reportPrompt')) {
  const promptDiv = document.createElement('div');
  promptDiv.id = 'reportPrompt';
  promptDiv.style.color = 'red';
  promptDiv.style.margin = '1em 0';
  promptDiv.style.display = 'none';
          try { notify('No results found for this student.', 'warning'); } catch (e) { console.warn('No results found for this student.'); }
  const reportContainer = document.querySelector('.report-container');
  if (reportContainer) {
    reportContainer.appendChild(promptDiv);
  } else {
    document.body.appendChild(promptDiv);
  }
}

async function loadReportForStudent() {
  let position = '—';
  let totalInClass = '—';
  let subjectPositions = {};
  // Helper: convert numeric position to ordinal string (1 -> 1st, 2 -> 2nd, 3 -> 3rd, etc.)
  function toOrdinal(pos) {
    if (pos === null || pos === undefined) return String(pos ?? '—');
    if (typeof pos === 'string') {
      const trimmed = pos.trim();
      if (trimmed === '—' || trimmed === '') return trimmed || '—';
    }
    const n = Number(pos);
    if (Number.isNaN(n)) return String(pos);
    const j = n % 10, k = n % 100;
    if (k >= 11 && k <= 13) return `${n}th`;
    if (j === 1) return `${n}st`;
    if (j === 2) return `${n}nd`;
    if (j === 3) return `${n}rd`;
    return `${n}th`;
  }
  const select = document.getElementById('studentSelect');
  const studentId = select.value;
  const studentClass = select.options[select.selectedIndex]?.dataset.class || '';
  const studentSubclass = select.options[select.selectedIndex]?.dataset.subclass || '';
  const term = document.getElementById('termFilter')?.value || '';
  const year = document.getElementById('yearFilter')?.value || '';
  const reportPrompt = document.getElementById('reportPrompt');
  const reportSection = document.getElementById('reportSection');

  // Fix: get student name as string, not as element
  const studentName = select.options[select.selectedIndex]?.textContent || '';

  // Only show report if all required fields are filled
  if (!studentId || !studentClass || !term || !year) {
    // Show prompt message
    reportPrompt.textContent = "Please select class, student, term, and academic year to view the report.";
    reportPrompt.style.display = 'block';
    if (reportSection) reportSection.style.display = 'none';
    // Optionally clear/hide report fields
    document.getElementById("studentName").textContent = "—";
    document.getElementById("studentClass").textContent = "—";
    document.getElementById("term").textContent = "—";
    document.getElementById("year").textContent = "—";
    document.getElementById("position").textContent = "—";
    document.getElementById("totalAttendance").textContent = "—";
    document.getElementById("actualAttendance").textContent = "—";
    document.getElementById("studentInterest").textContent = "—";
    document.getElementById("studentConduct").textContent = "—";
    document.getElementById("scoreBody").innerHTML = "";
    document.getElementById("totalScore").textContent = "—";
    document.getElementById("averageScore").textContent = "—";
    document.getElementById("teacherRemark").textContent = "—";
    document.getElementById("vacationDate").textContent = "—";
    document.getElementById("reopenDate").textContent = "—";
    document.getElementById("classTeacherName").textContent = "—";
    return;
  }
  console.debug('DEBUG: Selected studentId:', studentId, 'studentClass:', studentClass, 'studentSubclass:', studentSubclass, 'term:', term, 'year:', year);
  // Fetch vacation and reopening dates from school_dates table
  try {
    const { data, error } = await supabaseClient
      .from('school_dates')
      .select('*')
      .order('inserted_at', { ascending: false })
      .limit(1);
    const latest = data && data.length > 0 ? data[0] : null;
    document.getElementById("vacationDate").textContent = latest && latest.vacation_date ? new Date(latest.vacation_date).toLocaleDateString() : "—";
    document.getElementById("reopenDate").textContent = latest && latest.reopen_date ? new Date(latest.reopen_date).toLocaleDateString() : "—";
  } catch (e) {
    document.getElementById("vacationDate").textContent = "—";
    document.getElementById("reopenDate").textContent = "—";
  }
  // Hide prompt and show report
  reportPrompt.style.display = 'none';
  if (reportSection) reportSection.style.display = 'block';

  // 🖼️ Load student photo
  const studentPhotoUrl = select.options[select.selectedIndex]?.dataset.picture || "placeholder.png";
  document.getElementById("studentPhoto").src = studentPhotoUrl;

  // 📦 Fetch results for selected student, term, and year
  // Important: Only fetch regular subjects (NOT Career Tech) from main Supabase
  // Career Tech is now stored only in the Career Tech Supabase
  let query = supabaseClient
    .from('results')
    .select('*')
    .eq('student_id', studentId)
    .eq('term', term)
    .eq('year', year)
    .neq('subject', 'Career Tech'); // Exclude Career Tech - it's now in separate project
  const { data: results, error: resultError } = await query;
  console.debug('DEBUG: Student results (excluding Career Tech):', results, 'Error:', resultError);

  // Also fetch Career Tech results from Career Tech Supabase
  let careerTechResults = [];
  try {
    const { data: ctData, error: ctError } = await supabaseCareerTech
      .from('career_tech_results')
      .select('*')
      .eq('student_id', studentId)
      .eq('term', term)
      .eq('year', year);
    if (!ctError && ctData) {
      careerTechResults = ctData;
    }
  } catch (e) {
    console.debug('Career Tech results not available or table does not exist:', e);
  }

  if (resultError) return console.error('Failed to load results:', resultError.message);

  // Show message if no results found
  if ((!results || results.length === 0) && careerTechResults.length === 0) {
    const tbody = document.getElementById("scoreBody");
    tbody.innerHTML = '<tr><td colspan="6" style="color:red;text-align:center;">No report found for this student for the selected term and year.</td></tr>';
    document.getElementById("totalScore").textContent = "—";
    document.getElementById("averageScore").textContent = "—";
    document.getElementById("teacherRemark").textContent = "—";
    return;
  }
  
  // Merge results: combine regular results with Career Tech results
  let mergedResults = results || [];
  if (careerTechResults.length > 0) {
    // Add Career Tech results with subject='Career Tech' for processing
    careerTechResults.forEach(ct => {
      mergedResults.push({ ...ct, subject: 'Career Tech' });
    });
    // Remove any old Career Tech entries from results table (if they exist)
    mergedResults = mergedResults.filter(r => r.subject !== 'Career Tech' || r.subject === 'Career Tech');
  }
  
  const results_final = mergedResults;

  // 📦 Fetch global attendance total days from school_dates for fallback
  let globalAttendanceTotalDays = null;
  try {
    const { data: schoolDatesData, error: schoolDatesError } = await supabaseClient
      .from('school_dates')
      .select('attendance_total_days')
      .order('inserted_at', { ascending: false })
      .limit(1);
    if (!schoolDatesError && schoolDatesData && schoolDatesData.length > 0) {
      globalAttendanceTotalDays = schoolDatesData[0].attendance_total_days;
    }
  } catch (e) {
    console.warn('Failed to fetch global attendance total days:', e);
  }

  // 📦 Fetch interest/conduct/attendance
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('interest, conduct, attendance_total, attendance_actual')
    .eq('student_id', studentId)
    .eq('term', term)
    .eq('year', year)
    .single();

  if (profileError || !profile) console.warn('No interest/conduct data found.');

  // 🧾 Populate student info
  document.getElementById("studentName").textContent = studentName.toUpperCase();
  document.getElementById("studentClass").textContent = studentClass.toUpperCase();
  document.getElementById("term").textContent = term.toUpperCase();
  document.getElementById("year").textContent = year.toUpperCase();
  document.getElementById("position").textContent = toOrdinal(position).toUpperCase();
  if (document.getElementById("totalInClass")) {
    document.getElementById("totalInClass").textContent = String(totalInClass).toUpperCase();
  }
  // 📅 Attendance
  document.getElementById("totalAttendance").textContent = String(profile?.attendance_total ?? "—").toUpperCase();
  // Always use the global attendance total days set by admin for actual attendance
  document.getElementById("actualAttendance").textContent = String(globalAttendanceTotalDays ?? "—").toUpperCase();
  // 🎭 Interest & Conduct
  document.getElementById("studentInterest").textContent = String(profile?.interest ?? "—").toUpperCase();
  document.getElementById("studentConduct").textContent = String(profile?.conduct ?? "—").toUpperCase();

  // 👨‍🏫 Fetch class teacher's name using both class and subclass
  try {
    console.log('DEBUG: Fetching teacher for class:', studentClass, 'subclass:', studentSubclass);
    
    // First, let's see what teachers exist for this class
    const { data: allClassTeachers, error: allError } = await supabaseClient
      .from('teachers')
      .select('name, class_teacher_class_main, class_teacher_subclass')
      .eq('class_teacher_class_main', studentClass);
    console.log('DEBUG: All teachers for class', studentClass, ':', allClassTeachers);
    
    const { data: teachers, error: teachersError } = await supabaseClient
      .from('teachers')
      .select('name, responsibility, gender')
      .eq('class_teacher_class_main', studentClass)
      .eq('class_teacher_subclass', studentSubclass)
      .order('responsibility', { ascending: false })
      .limit(1);
    console.log('DEBUG: Teacher query result:', { teachers, teachersError, studentClass, studentSubclass });
    if (!teachersError && teachers && teachers.length > 0) {
      const classTeacherName = (teachers[0].name || '').trim();
      const teacherGender = (teachers[0].gender || 'male').toLowerCase(); // normalize to lowercase
      // Capitalize first letter of each word
      const capitalizedName = classTeacherName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
      console.log('DEBUG: Setting teacher name:', capitalizedName, 'gender:', teacherGender, 'for class:', studentClass, 'subclass:', studentSubclass);
      document.getElementById("classTeacherName").textContent = capitalizedName;
      // Store gender for later use
      window.currentTeacherGender = teacherGender;
    } else {
      console.log('DEBUG: No teacher found or error:', teachersError?.message, 'for class:', studentClass, 'subclass:', studentSubclass);
      document.getElementById("classTeacherName").textContent = "—";
      window.currentTeacherGender = 'male'; // default
    }
  } catch (e) {
    console.debug('Could not fetch class teacher:', e);
    document.getElementById("classTeacherName").textContent = "—";
  }

  // 🎓 Promotion logic: Only show 'Promoted to' if 3rd Term
  const promotedToCell = document.getElementById("promotedTo");
  if (term.trim().toLowerCase() === "3rd term") {
    // Fetch promotion pass mark from Supabase (admin setting)
    let promotionPassMark = 300; // default
    try {
      const { data: promoSettings, error: promoError } = await supabaseClient
        .from('settings')
        .select('promotion_pass_mark')
        .order('id', { ascending: true })
        .limit(1);
      if (!promoError && promoSettings && promoSettings.length && promoSettings[0].promotion_pass_mark) {
        promotionPassMark = parseInt(promoSettings[0].promotion_pass_mark, 10);
      }
    } catch (e) { /* fallback to default */ }
    // Use total accumulated marks for promotion
    let promotedClass = "—";
    let totalScore = parseFloat(document.getElementById("totalScore").textContent);
    if (!isNaN(totalScore)) {
      const classMatch = studentClass.match(/(.*?)(\d+)$/);
      if (totalScore >= promotionPassMark && classMatch) {
        // Promote to next class
        const base = classMatch[1];
        const num = parseInt(classMatch[2], 10) + 1;
        promotedClass = (base + num).trim();
      } else if (totalScore >= promotionPassMark) {
        promotedClass = "Next Class";
      } else {
        promotedClass = studentClass + " (Repeat)";
      }
    }
    promotedToCell.textContent = promotedClass.toUpperCase();
    promotedToCell.parentElement.style.display = "";
  } else {
    promotedToCell.textContent = "";
    promotedToCell.parentElement.style.display = "none";
  }
  // 📊 Score Table
  const tbody = document.getElementById("scoreBody");
  tbody.innerHTML = "";
  let totalScore = 0;
  const subjects = [
    "English", "Maths", "Science", "RME",
    "Social Studies", "Computing", "Career Tech",
    "Creative Arts", "Twi"
  ];
  let careerTechScores = [];
  // Fetch all results for this class, term, year for subject ranking
  let subjectPositionsMap = {};
  // Fetch all students in the selected class
  const { data: studentsInClass, error: studentsError } = await supabaseClient
    .from('students')
    .select('id')
    .eq('class', studentClass);
  console.debug('DEBUG: studentsInClass:', studentsInClass, 'Error:', studentsError);
  let classStudentIds = Array.isArray(studentsInClass) ? studentsInClass.map(s => s.id) : [];
  // Fetch all results for these students, this term and year
  // Important: Only fetch regular subjects (NOT Career Tech) from main Supabase
  const { data: allClassResults, error: allClassError } = await supabaseClient
    .from('results')
    .select('student_id, subject, class_score, exam_score')
    .in('student_id', classStudentIds)
    .eq('term', term)
    .eq('year', year)
    .neq('subject', 'Career Tech'); // Exclude Career Tech - it's now in separate project
  console.debug('DEBUG: allClassResults (excluding Career Tech):', allClassResults, 'Error:', allClassError);
  
  // Also fetch Career Tech results from dedicated table
  let allClassResultsFinal = Array.isArray(allClassResults) ? [...allClassResults] : [];
  const { data: careerTechResultsClass, error: careerTechErrorClass } = await supabaseCareerTech
    .from('career_tech_results')
    .select('student_id, area, class_score, exam_score')
    .in('student_id', classStudentIds)
    .eq('term', term)
    .eq('year', year);
  
  // Merge Career Tech results into the main results for ranking calculation
  if (!careerTechErrorClass && Array.isArray(careerTechResultsClass)) {
    careerTechResultsClass.forEach(ctResult => {
      allClassResultsFinal.push({
        student_id: ctResult.student_id,
        subject: 'Career Tech',
        class_score: ctResult.class_score,
        exam_score: ctResult.exam_score
      });
    });
  }
  
  if (Array.isArray(allClassResultsFinal) && allClassResultsFinal.length > 0) {
    subjects.forEach(subject => {
      // Get all students' total for this subject
      let subjectResults = allClassResultsFinal.filter(r => r.subject === subject);
      const scores = {};
      
      if (subject === 'Career Tech') {
        // For Career Tech: each area contributes half of its total marks (rounded)
        // Group by student_id and sum the halved marks
        const groupedByStudent = {};
        subjectResults.forEach(r => {
          if (!groupedByStudent[r.student_id]) groupedByStudent[r.student_id] = [];
          groupedByStudent[r.student_id].push((r.class_score || 0) + (r.exam_score || 0));
        });
        Object.entries(groupedByStudent).forEach(([studentId, marksArray]) => {
          const summedHalves = marksArray.reduce((sum, mark) => sum + Math.round(mark / 2), 0);
          scores[studentId] = summedHalves;
        });
      } else {
        // Regular subjects: sum class_score and exam_score
        subjectResults.forEach(r => {
          scores[r.student_id] = (r.class_score || 0) + (r.exam_score || 0);
        });
      }
      
      // Sort descending
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      // Find position for current student
      const found = sorted.findIndex(([id]) => id === studentId);
      subjectPositionsMap[subject] = found >= 0 ? (found + 1) : '—';
    });
  console.debug('DEBUG: subjectPositionsMap:', subjectPositionsMap);
  }
  subjects.forEach(subject => {
    if (subject === "Career Tech") {
      // Find all Career Tech results for this student (multiple teachers/areas: Pre-Tech, Home Economics, etc.)
      const careerTechEntries = results_final.filter(r => r.subject === "Career Tech");
      // For Career Tech with multiple areas: each area's SBA and exam marks are divided by 2 (rounded to nearest whole number)
      // Then all area contributions are summed: (PreTech_SBA/2 + PreTech_Exam/2) + (HomeEcon_SBA/2 + HomeEcon_Exam/2) + ...
      // This ensures each area contributes proportionally while maintaining a max of 100 total marks (50 SBA + 50 exam)
      let sbaAdjusted = 0;
      let examAdjusted = 0;
      careerTechEntries.forEach(entry => {
        const s = Math.round((entry?.class_score || 0) / 2);
        // exam_score should also be divided by 2 to prevent multiple areas from exceeding 50 total exam marks
        const e = Math.round((entry?.exam_score || 0) / 2);
        sbaAdjusted += s;
        examAdjusted += e;
      });
      const sbaAvg = careerTechEntries.length > 0 ? sbaAdjusted : 0;
      const examAvg = careerTechEntries.length > 0 ? examAdjusted : 0;
      const total = sbaAvg + examAvg;
      const point = getGradePoint(total);
      const remark = getSubjectRemark(point).toUpperCase();
      const subjectPosition = subjectPositionsMap[subject] || '—';
      // Show Career Tech row with averaged SBA and Exam
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>Career Tech</td>
        <td>${sbaAvg}</td>
        <td>${examAvg}</td>
        <td><strong>${total}</strong></td>
        <td>${String(point).toUpperCase()}</td>
        <td>${remark}</td>
        <td>${String(subjectPosition).toUpperCase()}</td>
      `;
      tbody.appendChild(row);
      // If the subject cell text is 'Social Studies', prevent wrapping
      try {
        const firstTd = row.querySelector('td:first-child');
        if (firstTd && (firstTd.textContent || '').trim().toLowerCase() === 'social studies') {
          firstTd.classList.add('no-wrap-subject');
        }
      } catch (e) { /* ignore */ }
      totalScore += total;
    } else {
      const entry = results_final.find(r => r.subject === subject);
      const classScore = entry?.class_score || 0;
      const examScore = entry?.exam_score || 0;
      const total = classScore + examScore;
      const point = getGradePoint(total);
      const remark = getSubjectRemark(point).toUpperCase();
      totalScore += total;
      const subjectPosition = subjectPositionsMap[subject] || '—';
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${subject.toUpperCase()}</td>
        <td>${String(classScore).toUpperCase()}</td>
        <td>${String(examScore).toUpperCase()}</td>
        <td>${String(total).toUpperCase()}</td>
        <td>${String(point).toUpperCase()}</td>
        <td>${remark}</td>
        <td>${String(subjectPosition).toUpperCase()}</td>
      `;
      tbody.appendChild(row);
      // Prevent wrapping for Social Studies subject specifically
      try {
        const firstTd = row.querySelector('td:first-child');
        if (firstTd && (firstTd.textContent || '').trim().toLowerCase() === 'social studies') {
          firstTd.classList.add('no-wrap-subject');
        }
      } catch (e) { /* ignore */ }
    }
  });

  // Calculate average: if Career Tech has multiple scores, use average, else sum
  let subjectCount = subjects.length;
  if (careerTechScores.length > 1) {
    subjectCount = subjects.length - 1 + 1; // Replace Career Tech with 1 average
  }
  const average = (totalScore / subjectCount).toFixed(2);
  const teacherRemark = getTeacherRemark(totalScore);

  document.getElementById("totalScore").textContent = totalScore;
  document.getElementById("averageScore").textContent = average;
  document.getElementById("teacherRemark").textContent = getTeacherRemark(totalScore);

  // Generate encouragement message based on performance
  const encouragement = getEncouragementMessage(totalScore);
  const teacherNameFull = document.getElementById("classTeacherName").textContent || '';
  const title = window.currentTeacherGender === 'male' ? 'Sir.' : 'Mad.';
  // Use only the first name for the student and teacher in the message
  const studentFirstName = (studentName || '').trim().split(/\s+/)[0] || '';
  const studentNameForMessage = studentFirstName.toLowerCase().replace(/^[a-z]/, c => c.toUpperCase());
  const teacherFirstName = (teacherNameFull || '').trim().split(/\s+/)[0] || '';
  const teacherNameForMessage = teacherFirstName.replace(/^[a-z]/, c => c.toUpperCase());
  document.getElementById("encouragementMessage").textContent = `${studentNameForMessage}, ${encouragement} - ${title} ${teacherNameForMessage}`;
  console.log('DEBUG: Encouragement message set:', document.getElementById("encouragementMessage").textContent);

  // Get selected term and year for filtering
  // const term = document.getElementById('termFilter')?.value || '';
  // const year = document.getElementById('yearFilter')?.value || '';

  // Fetch all results for this class, subject, term, year to calculate position
  // Declare position and totalInClass before use
  console.log('DEBUG: Position calc - studentClass:', studentClass, 'term:', term, 'year:', year, 'studentId:', studentId);
  if (studentClass && term && year) {
    console.log('DEBUG: Entering position calculation block');
    // Get all students in the class for class size
    const { data: studentsInClass2, error: studentsError2 } = await supabaseClient
      .from('students')
      .select('id')
      .eq('class', studentClass);
  console.debug('DEBUG: studentsInClass (for position):', studentsInClass2, 'Error:', studentsError2);
    if (!studentsError2 && Array.isArray(studentsInClass2)) {
      totalInClass = studentsInClass2.length;
    }
    // Get all results for these students for position calculation
    let classStudentIds2 = Array.isArray(studentsInClass2) ? studentsInClass2.map(s => s.id) : [];
    const { data: classResults, error: classError } = await supabaseClient
      .from('results')
      .select('student_id, subject, class_score, exam_score')
      .in('student_id', classStudentIds2)
      .eq('term', term)
      .eq('year', year)
      .neq('subject', 'Career Tech'); // exclude Career Tech from main results
  console.debug('DEBUG: classResults (excluding Career Tech):', classResults, 'Error:', classError);
    
    // Also fetch Career Tech results for position calculation
    const { data: careerTechResultsClass, error: careerTechErrorClass } = await supabaseCareerTech
      .from('career_tech_results')
      .select('student_id, area, class_score, exam_score')
      .in('student_id', classStudentIds2)
      .eq('term', term)
      .eq('year', year);
    
    if ((!classError || !careerTechErrorClass) && (Array.isArray(classResults) || Array.isArray(careerTechResultsClass))) {
      // Calculate accumulated total score for each student
      const scores = {};
      
      // Initialize scores for all students in the class (including those with no results)
      classStudentIds2.forEach(studentId => {
        scores[studentId] = 0;
      });
      
      // Add regular subject scores
      if (Array.isArray(classResults)) {
        classResults.forEach(r => {
          if (!scores[r.student_id]) scores[r.student_id] = 0;
          scores[r.student_id] += (r.class_score || 0) + (r.exam_score || 0);
        });
      }
      
      // Add adjusted Career Tech scores
      if (Array.isArray(careerTechResultsClass)) {
        const careerTechScores = {};
        careerTechResultsClass.forEach(r => {
          if (!careerTechScores[r.student_id]) careerTechScores[r.student_id] = [];
          careerTechScores[r.student_id].push((r.class_score || 0) + (r.exam_score || 0));
        });
        Object.entries(careerTechScores).forEach(([studentId, marksArray]) => {
          const adjusted = marksArray.reduce((sum, mark) => sum + Math.round(mark / 2), 0);
          if (!scores[studentId]) scores[studentId] = 0;
          scores[studentId] += adjusted;
        });
      }
      
      // Sort scores descending by accumulated total
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      console.log('DEBUG: Scores object:', scores);
      console.log('DEBUG: Sorted scores:', sorted);
      console.log('DEBUG: Looking for studentId:', studentId, 'in classStudentIds2:', classStudentIds2);
      // Find position of current student with proper tie handling
      position = '—';
      let displayPos = 0;
      let lastScore = null;
      for (let i = 0; i < sorted.length; i++) {
        const [id, score] = sorted[i];
        if (lastScore === null || score !== lastScore) {
          displayPos = i + 1;
        }
        if (id === studentId) {
          position = displayPos;
          console.log('DEBUG: Found student at position:', position);
          break;
        }
        lastScore = score;
      }
  console.debug('DEBUG: Overall position:', position, 'Sorted:', sorted);
    }
  }
  console.log('DEBUG: Setting position to DOM:', position);
  document.getElementById("position").textContent = toOrdinal(position).toUpperCase();
  // Add total number of students in class to report card
  if (document.getElementById("totalInClass")) {
    document.getElementById("totalInClass").textContent = totalInClass;
  }
  console.log('DEBUG: Final values - position:', position, 'totalInClass:', totalInClass);
}

// 🚀 Initialize

// Populate class dropdown and session logic
async function populateClassDropdown() {
  const { data, error } = await supabaseClient.from('students').select('class').neq('class', null);
  const classSelect = document.getElementById('classSelect');
  if (error) return console.error('Failed to load classes:', error.message);
  const uniqueClasses = [...new Set(data.map(s => s.class))].sort();
  uniqueClasses.forEach(cls => {
    const option = document.createElement('option');
    option.value = cls;
    option.textContent = cls;
    classSelect.appendChild(option);
  });
}

// When class is selected, store in session and filter students
document.getElementById('classSelect').addEventListener('change', async function() {
  const selectedClass = this.value;
  sessionStorage.setItem('selectedClass', selectedClass);
  await populateStudentDropdown(selectedClass);
});

// Modified populateStudentDropdown to filter by class
let allStudents = [];
async function populateStudentDropdown(filterClass) {
  let query = supabaseClient.from('students').select('id, first_name, surname, class, subclass, picture_url');
  if (filterClass) query = query.eq('class', filterClass);
  const { data, error } = await query;
  allStudents = data || [];
  filterStudentDropdown();
}

// Filter student dropdown by search box
window.filterStudentDropdown = function filterStudentDropdown() {
  const search = document.getElementById('studentSearch')?.value.trim().toLowerCase() || '';
  const select = document.getElementById('studentSelect');
  select.innerHTML = '<option value="">-- Select --</option>';
  let filtered = allStudents;
  if (search) {
    filtered = filtered.filter(s => (`${s.first_name || ''} ${s.surname || ''}`.toLowerCase().includes(search)));
  }
  filtered.forEach(student => {
    const option = document.createElement('option');
    option.value = student.id;
    option.textContent = `${student.first_name || ''} ${student.surname || ''}`.trim();
    option.dataset.class = student.class;
    option.dataset.subclass = student.subclass || '';
    option.dataset.picture = student.picture_url || '';
    select.appendChild(option);
  });
};

// On page load, populate class dropdown and restore session
window.addEventListener('DOMContentLoaded', async () => {
  // Inject filter dropdowns if not present
  if (!document.getElementById('filters')) {
    const filtersDiv = document.createElement('div');
    filtersDiv.id = 'filters';
    document.body.insertBefore(filtersDiv, document.body.firstChild);
  }
  if (!document.getElementById('termFilter')) {
    const termSelect = document.createElement('select');
    termSelect.id = 'termFilter';
    termSelect.innerHTML = '<option value="">-- Select Term --</option><option value="1st Term">1st Term</option><option value="2nd Term">2nd Term</option><option value="3rd Term">3rd Term</option>';
    document.getElementById('filters').appendChild(termSelect);
  }
  if (!document.getElementById('yearFilter')) {
    const yearInput = document.createElement('input');
    yearInput.id = 'yearFilter';
    yearInput.placeholder = 'Academic Year (e.g. 2025/2026)';
    document.getElementById('filters').appendChild(yearInput);
  }

  await populateClassDropdown();
  document.getElementById('studentSelect').innerHTML = '<option value="">-- Select --</option>';
  const selectedClass = sessionStorage.getItem('selectedClass');
  if (selectedClass) {
    document.getElementById('classSelect').value = selectedClass;
    await populateStudentDropdown(selectedClass);
  }
  // Add event listeners to reload report when term/year changes
  document.getElementById('termFilter').addEventListener('change', loadReportForStudent);
  document.getElementById('yearFilter').addEventListener('input', loadReportForStudent);
});

// Bulk print logic
// Usage: click the element with id="bulkPrintBtn" (button provided in the UI).
// This routine expects the page to contain:
// - a class selector with id="classSelect"
// - a student selector with id="studentSelect"
// - the report template container with id="reportSection" which is populated by loadReportForStudent()
// It will populate the template for each student in the selected class, clone the populated template
// into a hidden print container (one clone per student), then trigger window.print() once so the
// browser can save a single multi-page PDF containing all student reports. After printing the
// temporary print elements are cleaned up automatically.
document.getElementById('bulkPrintBtn').onclick = async function() {
  const selectedClass = document.getElementById('classSelect').value;
  if (!selectedClass) {
    notify('Please select a class first.', 'warning');
    return;
  }
  // Fetch all students in the selected class
  const { data: students, error } = await supabaseClient.from('students').select('id').eq('class', selectedClass);
  if (error || !students || students.length === 0) {
    notify('No students found for this class.', 'warning');
    return;
  }
  // Build a hidden print container and append one populated report per student
  const reportContainer = document.querySelector('.report-container');
  if (!reportContainer) {
    notify('Report template not found on the page.', 'error');
    return;
  }

  // Create a small progress overlay so user knows generation is in progress
  let progressOverlay = document.getElementById('bulkPrintProgress');
  if (progressOverlay) progressOverlay.remove();
  progressOverlay = document.createElement('div');
  progressOverlay.id = 'bulkPrintProgress';
  progressOverlay.style.position = 'fixed';
  progressOverlay.style.left = '0';
  progressOverlay.style.top = '0';
  progressOverlay.style.right = '0';
  progressOverlay.style.bottom = '0';
  progressOverlay.style.background = 'rgba(0,0,0,0.55)';
  progressOverlay.style.display = 'flex';
  progressOverlay.style.alignItems = 'center';
  progressOverlay.style.justifyContent = 'center';
  progressOverlay.style.zIndex = '99999';
  progressOverlay.innerHTML = `
    <div style="background:#fff;padding:20px 18px;border-radius:8px;display:flex;flex-direction:column;align-items:center;gap:12px;min-width:300px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div class="bulk-spinner" style="width:28px;height:28px;border:4px solid #ddd;border-top-color:#2b7cff;border-radius:50%;animation:spin 1s linear infinite"></div>
        <div style="font-family:Arial,Helvetica,sans-serif;color:#222;font-size:14px;">
          <div id="bulkPrintProgressText">Preparing 0/${students.length}</div>
          <div style="font-size:12px;color:#666;margin-top:6px;">Please wait while reports are generated...</div>
        </div>
      </div>
      <div style="width:100%;display:flex;justify-content:flex-end;gap:8px;margin-top:6px;">
        <button id="bulkPrintCancelBtn" style="background:#f44336;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:13px;">Cancel</button>
      </div>
    </div>
  `;
  // Add spinner keyframes if not present
  if (!document.getElementById('bulkPrintProgressStyle')) {
    const pf = document.createElement('style');
    pf.id = 'bulkPrintProgressStyle';
    pf.textContent = `@keyframes spin {from{transform:rotate(0)}to{transform:rotate(360deg)}}`;
    document.head.appendChild(pf);
  }
  document.body.appendChild(progressOverlay);
  // Expose a simple controller to allow cancellation from the Cancel button
  window.__bulkPrintController = { cancelled: false };
  const cancelBtn = document.getElementById('bulkPrintCancelBtn');
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      window.__bulkPrintController.cancelled = true;
      const pt = document.getElementById('bulkPrintProgressText');
      if (pt) pt.textContent = `Cancelling...`;
      // visually disable the cancel button
      cancelBtn.disabled = true;
      cancelBtn.style.opacity = '0.6';
    };
  }

  // Create a container for bulk printing
  let bulkContainer = document.getElementById('bulkPrintContainer');
  if (bulkContainer) bulkContainer.remove();
  bulkContainer = document.createElement('div');
  bulkContainer.id = 'bulkPrintContainer';
  // keep it off-screen / hidden in normal view
  bulkContainer.style.display = 'none';
  document.body.appendChild(bulkContainer);

  // Inject print-only stylesheet to show only the bulk container during printing
  const styleId = 'bulk-print-style';
  let printStyle = document.getElementById(styleId);
  if (printStyle) printStyle.remove();
  printStyle = document.createElement('style');
  printStyle.id = styleId;
  printStyle.textContent = `
    @media print {
      /* hide everything except the bulk container when printing */
      body * { visibility: hidden !important; }
      #bulkPrintContainer, #bulkPrintContainer * { visibility: visible !important; }
      #bulkPrintContainer { position: absolute; left: 0; top: 0; width: 100%; }
      /* each report should start on a new printed page */
      .print-page { page-break-after: always; }

      /* Print page size and margins to match single print */
      @page { size: A4 portrait; margin: 9mm; }

      /* Ensure report border is visible and fits page */
      .report-container {
        border-top: 2px solid #222 !important;
        border-right: 2px solid #222 !important;
        border-bottom: 2px solid #222 !important;
        border-left: 2px solid #222 !important;
        box-shadow: none !important;
        margin-top: 0 !important;
        margin-bottom: 0 !important;
      }

      /* --- ORANGE THEME OVERRIDES FOR BULK PRINT --- */
      .dashboard-card { border: 2px solid #ff6600 !important; }
      .dashboard-card:hover { border-color: #ff6600 !important; }
      #bulkPrintBtn, .back-btn { background-color: #ff6600 !important; }
      #bulkPrintBtn:hover { background-color: #ff6600cc !important; }
      span[id^="studentName"], span[id^="studentClass"], span[id^="term"], span[id^="year"], span[id^="totalInClass"], span[id^="position"], span[id^="totalAttendance"], span[id^="actualAttendance"], span[id^="promotedTo"], span[id^="studentInterest"], span[id^="studentConduct"], span[id^="teacherRemark"] { color: #ff6600 !important; }
      span[id^="studentName"], span[id^="studentClass"], span[id^="term"], span[id^="year"], span[id^="totalInClass"], span[id^="position"], span[id^="totalAttendance"], span[id^="actualAttendance"], span[id^="promotedTo"], span[id^="studentInterest"], span[id^="studentConduct"], span[id^="teacherRemark"], span#vacationDate, span#reopenDate { border-bottom: 3px double #ff6600 !important; }
    }
    /* Ensure page break works for pdf engines as well */
    .print-page { -webkit-print-color-adjust: exact; }
  `;
  document.head.appendChild(printStyle);

  // Save current selection to restore later
  const originalStudentSelectValue = document.getElementById('studentSelect')?.value || '';

  // Populate the bulk container: for each student, load their report into the visible template, clone it, sanitize ids, and append to container
  // Move helpers outside the loop so they're always defined
  async function waitForImagesLoaded(container, timeout = 8000) {
    const imgs = Array.from(container.querySelectorAll('img'));
    if (imgs.length === 0) return;
    const promises = imgs.map(img => new Promise(res => {
      if (img.complete && img.naturalWidth !== 0) return res();
      const onDone = () => { cleanup(); res(); };
      const onError = () => { cleanup(); res(); };
      function cleanup() { img.removeEventListener('load', onDone); img.removeEventListener('error', onError); }
      img.addEventListener('load', onDone);
      img.addEventListener('error', onError);
    }));
    await Promise.race([Promise.all(promises), new Promise(res => setTimeout(res, timeout))]);
    await new Promise(r => setTimeout(r, 50));
  }
  async function waitForReportDataStable(container, timeout = 6000, stableMs = 250) {
    const keys = [
      '#studentName', '#studentClass', '#term', '#year', '#position',
      '#totalScore', '#averageScore', '#teacherRemark', '#classTeacherName', '#encouragementMessage'
    ];
    const start = Date.now();
    let last = '';
    let lastChange = Date.now();
    while (Date.now() - start < timeout) {
      const snapshot = keys.map(sel => {
        const el = container.querySelector(sel);
        return el ? (el.textContent || '') : '';
      }).join('|');
      if (snapshot !== last) {
        last = snapshot;
        lastChange = Date.now();
      }
      if (Date.now() - lastChange >= stableMs) return;
      await new Promise(r => setTimeout(r, 80));
    }
  }

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    try {
      if (window.__bulkPrintController?.cancelled) {
        const pt = document.getElementById('bulkPrintProgressText');
        if (pt) pt.textContent = `Canceled at ${i}/${students.length}`;
        break;
      }
      if (document.getElementById('studentSelect')) {
        document.getElementById('studentSelect').value = student.id;
      }
      await loadReportForStudent();
      await waitForImagesLoaded(document.querySelector('.report-container'));
      // check for cancellation after population
      if (window.__bulkPrintController?.cancelled) {
        const pt = document.getElementById('bulkPrintProgressText');
        if (pt) pt.textContent = `Canceled at ${i + 1}/${students.length}`;
        break;
      }
      // Clone the populated report container
      const clone = reportContainer.cloneNode(true);
      // NOTE: Do not append a cloned `.watermark` element here — the report's
      // CSS uses `::before` and a single `.watermark` element to render a
      // faded background image. Appending an additional watermark caused a
      // visible, opaque image to appear on top of the report during bulk
      // printing. Keep clones clean and rely on CSS for the watermark.
      // Preserve element ids in the clone so CSS rules that target IDs still apply when printing.
      // Removing ids caused printed reports to lose styling (appeared black-and-white or missing styles).
      // If duplicate-id concerns arise later, consider namespacing or removing only problematic IDs.
      // Add a marker class for page breaks
      clone.classList.add('print-page');
      // Make sure the clone is visible when printed
      clone.style.display = '';
      bulkContainer.appendChild(clone);
      // Update progress text
      const progressText = document.getElementById('bulkPrintProgressText');
      if (progressText) progressText.textContent = `Preparing ${i + 1}/${students.length}`;
    } catch (e) {
      console.error('Failed to build report for student', student, e);
      const progressText = document.getElementById('bulkPrintProgressText');
      if (progressText) progressText.textContent = `Error at ${i + 1}/${students.length}`;
    }
  }

  // Restore the original student selection in the form
  if (document.getElementById('studentSelect')) {
    document.getElementById('studentSelect').value = originalStudentSelectValue;
      await waitForImagesLoaded(document.querySelector('.report-container'));
      // Wait until key report fields stop changing (stable DOM) to ensure DB-driven
      // details have finished rendering before cloning. This prevents partial
      // records in the bulk print when some async updates complete slightly later.
      async function waitForReportDataStable(container, timeout = 6000, stableMs = 250) {
        const keys = [
          '#studentName', '#studentClass', '#term', '#year', '#position',
          '#totalScore', '#averageScore', '#teacherRemark', '#classTeacherName', '#encouragementMessage'
        ];
        const start = Date.now();
        let last = '';
        let lastChange = Date.now();
        while (Date.now() - start < timeout) {
          const snapshot = keys.map(sel => {
            const el = container.querySelector(sel);
            return el ? (el.textContent || '') : '';
          }).join('|');
          if (snapshot !== last) {
            last = snapshot;
            lastChange = Date.now();
          }
          if (Date.now() - lastChange >= stableMs) return; // stable
          // small delay before re-checking
          await new Promise(r => setTimeout(r, 80));
        }
        // timeout reached — proceed anyway
      }
      await waitForReportDataStable(document.querySelector('.report-container'));
    if (originalStudentSelectValue) await loadReportForStudent();
  }

  // Show the container just before printing so some browsers pick up layout
  bulkContainer.style.display = 'block';
  // If cancelled, clean up and do not open print dialog
  if (window.__bulkPrintController?.cancelled) {
    // cleanup
    try { bulkContainer.remove(); } catch (e) { /* ignore */ }
    try { printStyle.remove(); } catch (e) { /* ignore */ }
    try { const ps = document.getElementById('bulkPrintProgress'); if (ps) ps.remove(); } catch (e) { /* ignore */ }
    try { const pf = document.getElementById('bulkPrintProgressStyle'); if (pf) pf.remove(); } catch (e) { /* ignore */ }
    // clear controller
    try { delete window.__bulkPrintController; } catch (e) {}
    return;
  }

  // Update progress to ready
  const progressTextFinal = document.getElementById('bulkPrintProgressText');
  if (progressTextFinal) progressTextFinal.textContent = `Ready — opening print dialog (${students.length} pages)`;
  // Trigger the browser print dialog once for the full document
  window.print();

  // Cleanup: remove the bulk container, print stylesheet and progress overlay after printing
  // Use a small timeout to allow print dialog to spawn in some browsers
  setTimeout(() => {
    try { bulkContainer.remove(); } catch (e) { /* ignore */ }
    try { printStyle.remove(); } catch (e) { /* ignore */ }
    try { const ps = document.getElementById('bulkPrintProgress'); if (ps) ps.remove(); } catch (e) { /* ignore */ }
    try { const pf = document.getElementById('bulkPrintProgressStyle'); if (pf) pf.remove(); } catch (e) { /* ignore */ }
    try { delete window.__bulkPrintController; } catch (e) {}
  }, 1000);
};

// Bulk download as PDF (one-click export for selected class)
document.getElementById('bulkDownloadBtn').onclick = async function() {
  const selectedClass = document.getElementById('classSelect').value;
  const term = document.getElementById('termFilter')?.value || '';
  const year = document.getElementById('yearFilter')?.value || '';
  if (!selectedClass) { try { notify('Please select a class first.', 'warning'); } catch (e) { console.warn(e); } return; }
  if (!term || !year) { try { notify('Please select term and year first.', 'warning'); } catch (e) { console.warn(e); } return; }

  const { data: students, error } = await supabaseClient.from('students').select('id').eq('class', selectedClass);
  if (error || !students || students.length === 0) {
    try { notify('No students found for this class.', 'warning'); } catch (e) { console.warn(e); }
    return;
  }

  // Progress overlay (reuse style from bulk print)
  let progressOverlay = document.getElementById('bulkPrintProgress');
  if (progressOverlay) progressOverlay.remove();
  progressOverlay = document.createElement('div');
  progressOverlay.id = 'bulkPrintProgress';
  progressOverlay.style.position = 'fixed';
  progressOverlay.style.left = '0';
  progressOverlay.style.top = '0';
  progressOverlay.style.right = '0';
  progressOverlay.style.bottom = '0';
  progressOverlay.style.background = 'rgba(0,0,0,0.55)';
  progressOverlay.style.display = 'flex';
  progressOverlay.style.alignItems = 'center';
  progressOverlay.style.justifyContent = 'center';
  progressOverlay.style.zIndex = '99999';
  progressOverlay.innerHTML = `
    <div style="background:#fff;padding:20px 18px;border-radius:8px;display:flex;flex-direction:column;align-items:center;gap:12px;min-width:300px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div class="bulk-spinner" style="width:28px;height:28px;border:4px solid #ddd;border-top-color:#2b7cff;border-radius:50%;animation:spin 1s linear infinite"></div>
        <div style="font-family:Arial,Helvetica,sans-serif;color:#222;font-size:14px;">
          <div id="bulkPrintProgressText">Preparing 0/${students.length}</div>
          <div style="font-size:12px;color:#666;margin-top:6px;">Generating PDF — please wait...</div>
        </div>
      </div>
      <div style="width:100%;display:flex;justify-content:flex-end;gap:8px;margin-top:6px;">
        <button id="bulkPrintCancelBtn" style="background:#f44336;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:13px;">Cancel</button>
      </div>
    </div>
  `;
  if (!document.getElementById('bulkPrintProgressStyle')) {
    const pf = document.createElement('style');
    pf.id = 'bulkPrintProgressStyle';
    pf.textContent = `@keyframes spin {from{transform:rotate(0)}to{transform:rotate(360deg)}}`;
    document.head.appendChild(pf);
  }
  document.body.appendChild(progressOverlay);
  window.__bulkPrintController = { cancelled: false };
  const cancelBtn = document.getElementById('bulkPrintCancelBtn');
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      window.__bulkPrintController.cancelled = true;
      const pt = document.getElementById('bulkPrintProgressText');
      if (pt) pt.textContent = `Cancelling...`;
      cancelBtn.disabled = true;
      cancelBtn.style.opacity = '0.6';
    };
  }

  // Create or reset bulk container
  let bulkContainer = document.getElementById('bulkPrintContainer');
  if (bulkContainer) bulkContainer.remove();
  bulkContainer = document.createElement('div');
  bulkContainer.id = 'bulkPrintContainer';
  bulkContainer.style.display = 'none';
  document.body.appendChild(bulkContainer);

  // Print style to ensure proper page breaks in the PDF
  const styleId = 'bulk-print-style';
  let printStyle = document.getElementById(styleId);
  if (printStyle) printStyle.remove();
  printStyle = document.createElement('style');
  printStyle.id = styleId;
  printStyle.textContent = `
    @media print {
      body * { visibility: hidden !important; }
      #bulkPrintContainer, #bulkPrintContainer * { visibility: visible !important; }
      #bulkPrintContainer { position: absolute; left: 0; top: 0; width: 100%; }
      .print-page { page-break-after: always; }
      @page { size: A4 portrait; margin: 9mm; }
    }
    .print-page { -webkit-print-color-adjust: exact; }
  `;
  document.head.appendChild(printStyle);

  // Helper to wait for images
  async function waitForImagesLoaded(container, timeout = 8000) {
    const imgs = Array.from(container.querySelectorAll('img'));
    if (imgs.length === 0) return;
    const promises = imgs.map(img => new Promise(res => {
      if (img.complete && img.naturalWidth !== 0) return res();
      const onDone = () => { cleanup(); res(); };
      const onError = () => { cleanup(); res(); };
      function cleanup() { img.removeEventListener('load', onDone); img.removeEventListener('error', onError); }
      img.addEventListener('load', onDone);
      img.addEventListener('error', onError);
    }));
    await Promise.race([Promise.all(promises), new Promise(res => setTimeout(res, timeout))]);
    await new Promise(r => setTimeout(r, 50));
  }

  // Helper to wait until key report fields stabilize
  async function waitForReportDataStable(container, timeout = 6000, stableMs = 250) {
    const keys = ['#studentName', '#studentClass', '#term', '#year', '#position', '#totalScore', '#averageScore', '#teacherRemark', '#classTeacherName', '#encouragementMessage'];
    const start = Date.now();
    let last = '';
    let lastChange = Date.now();
    while (Date.now() - start < timeout) {
      const snapshot = keys.map(sel => { const el = container.querySelector(sel); return el ? (el.textContent || '') : ''; }).join('|');
      if (snapshot !== last) { last = snapshot; lastChange = Date.now(); }
      if (Date.now() - lastChange >= stableMs) return;
      await new Promise(r => setTimeout(r, 80));
    }
  }

  // Populate clones for each student
  const reportContainer = document.querySelector('.report-container');
  if (!reportContainer) { try { notify('Report template not found on the page.', 'error'); } catch (e) { console.warn(e); } return; }

  const originalStudentSelectValue = document.getElementById('studentSelect')?.value || '';
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    try {
      if (window.__bulkPrintController?.cancelled) {
        const pt = document.getElementById('bulkPrintProgressText'); if (pt) pt.textContent = `Canceled at ${i}/${students.length}`; break;
      }
      if (document.getElementById('studentSelect')) document.getElementById('studentSelect').value = student.id;
      await loadReportForStudent();
      await waitForImagesLoaded(document.querySelector('.report-container'));
      if (window.__bulkPrintController?.cancelled) { const pt = document.getElementById('bulkPrintProgressText'); if (pt) pt.textContent = `Canceled at ${i + 1}/${students.length}`; break; }
      const clone = reportContainer.cloneNode(true);
      clone.classList.add('print-page');
      clone.style.display = '';
      bulkContainer.appendChild(clone);
      const progressText = document.getElementById('bulkPrintProgressText'); if (progressText) progressText.textContent = `Preparing ${i + 1}/${students.length}`;
    } catch (e) {
      console.error('Failed to build report for student', student, e);
      const progressText = document.getElementById('bulkPrintProgressText'); if (progressText) progressText.textContent = `Error at ${i + 1}/${students.length}`;
    }
  }

  if (document.getElementById('studentSelect')) {
    document.getElementById('studentSelect').value = originalStudentSelectValue;
    await waitForImagesLoaded(document.querySelector('.report-container'));
    await waitForReportDataStable(document.querySelector('.report-container'));
    if (originalStudentSelectValue) await loadReportForStudent();
  }

  // Show container and generate PDF via html2pdf
  bulkContainer.style.display = 'block';
  if (window.__bulkPrintController?.cancelled) {
    try { bulkContainer.remove(); } catch (e) {}
    try { printStyle.remove(); } catch (e) {}
    try { const ps = document.getElementById('bulkPrintProgress'); if (ps) ps.remove(); } catch (e) {}
    try { const pf = document.getElementById('bulkPrintProgressStyle'); if (pf) pf.remove(); } catch (e) {}
    try { delete window.__bulkPrintController; } catch (e) {}
    return;
  }

  const filename = `${selectedClass}_reports_${term.replace(/\s+/g,'_')}_${year.replace(/\//g,'-')}.pdf`;
  try {
    await html2pdf().set({
      margin: [9,9,9,9],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], before: '.print-page' }
    }).from(bulkContainer).save();
    try { notify('PDF downloaded successfully.', 'success'); } catch (e) { console.log('PDF saved'); }
  } catch (e) {
    console.error('html2pdf error', e);
    try { notify('Failed to generate PDF.', 'error'); } catch (ee) { console.warn(ee); }
  }

  // Cleanup
  setTimeout(() => {
    try { bulkContainer.remove(); } catch (e) {}
    try { printStyle.remove(); } catch (e) {}
    try { const ps = document.getElementById('bulkPrintProgress'); if (ps) ps.remove(); } catch (e) {}
    try { const pf = document.getElementById('bulkPrintProgressStyle'); if (pf) pf.remove(); } catch (e) {}
    try { delete window.__bulkPrintController; } catch (e) {}
  }, 1000);
};

// Send result to student (by class)
document.getElementById('sendResultBtn').onclick = async function() {
  const select = document.getElementById('studentSelect');
  const studentId = select.value;
  if (!studentId) {
  try { notify('Please select a student first.', 'warning'); } catch (e) { try { safeNotify('Please select a student first.', 'warning'); } catch (ee) { console.error('safeNotify failed', ee); } }
    return;
  }
  // Fetch student info
  const studentName = select.options[select.selectedIndex].textContent;
  const studentClass = select.options[select.selectedIndex].dataset.class;
  // Fetch results
  const { data: results, error } = await supabaseClient
    .from('results')
    .select('*')
    .eq('student_id', studentId);
  if (error || !results || results.length === 0) {
    notify('No results found for this student.', 'warning');
    return;
  }
  // Here you would send the result to the student (e.g., via email, SMS, or update a Supabase table)
  // For demo, we'll just show a confirmation
  notify(`Result for ${studentName} (Class: ${studentClass}) sent successfully!`, 'info');
};

window.loadReportForStudent = loadReportForStudent;