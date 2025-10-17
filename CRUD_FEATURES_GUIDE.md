# 📝 CRUD Features Guide - Complete Management System

## Overview

The AI Interview Platform now has **complete CRUD (Create, Read, Update, Delete)** functionality for:
- ✅ **Jobs** - Create, edit, delete job positions
- ✅ **Candidates** - Add, edit, delete candidates
- ✅ **Interview Questions** - Advanced question management with drag-and-drop

---

## 🎯 Job Management Features

### Create Jobs
1. Click **"Create New Job"** button
2. Enter job title (required)
3. Add job description (optional)
4. Add interview questions using advanced question editor
5. Click **"Create Job"**

### Edit Jobs
1. Click **"Edit"** button on any job card
2. Modify title, description, or questions
3. Click **"Update Job"**

### Delete Jobs
1. Click **trash icon** on job card
2. Confirm deletion
3. **Note:** All associated candidates will also be deleted

### Features
- View candidate count per job
- See default question count
- Active/inactive status badges
- Sort by creation date (newest first)

---

## 👥 Candidate Management Features

### Add Candidates
1. Select a job from Job Management
2. Click **"Add Candidate"** button
3. Enter candidate details:
   - Name (required)
   - Email (required)
   - Custom questions (optional)
4. Click **"Create Candidate & Generate Link"**
5. Interview link is automatically generated
6. Copy link to send to candidate

### Edit Candidates
1. Click **"Edit"** button on candidate card
2. Modify name, email, or custom questions
3. Click **"Update Candidate"**
4. **Note:** Interview link remains the same

### Delete Candidates
1. Click **"Delete"** button on candidate card
2. Confirm deletion
3. **Warning:** This deletes all interview data including transcripts

### Features
- Unique access token per candidate
- Interview link generation
- Status tracking: Created → Link Sent → In Progress → Completed → Reviewed
- Custom questions per candidate (or use job defaults)
- View interview results for completed interviews
- Copy interview link with one click

---

## 📋 Advanced Question Management

### New QuestionBankManager Component

A powerful, feature-rich question editor with:

#### ✨ Core Features
- **Drag and Drop** - Reorder questions by dragging
- **Expand/Collapse** - Click to expand question for editing
- **Character Counter** - See question length in real-time
- **Empty Question Warning** - Visual indicators for unfilled questions
- **Maximum Limit** - Up to 20 questions per job/candidate

#### 🎨 Question Actions

**Move Questions:**
- Click ↑ / ↓ buttons to move up/down
- Or drag and drop to reorder

**Duplicate Question:**
- Click duplicate icon to copy question
- Useful for similar questions

**Delete Question:**
- Click trash icon
- Minimum 1 question required

**Edit Question:**
- Click on collapsed question to expand
- Multi-line textarea for long questions
- Auto-saves on change

#### 🔧 Bulk Operations

**Expand/Collapse All:**
- Quickly expand all questions for overview
- Collapse all to save space

**Import Questions:**
- Click **"Import"**
- Paste multiple questions (one per line)
- Automatically parses and adds up to max limit

**Export Questions:**
- Click **"Export"**
- Copies all questions to clipboard
- Numbered format for easy sharing

---

## 🎨 User Interface Features

### Visual Indicators

**Status Badges:**
- 🔘 **Created** - Gray badge
- 🔵 **Link Sent** - Blue badge
- 🟡 **In Progress** - Yellow badge
- 🟢 **Completed** - Green badge
- 🟣 **Reviewed** - Purple badge

**Question States:**
- ⚠️ **Empty questions** - Yellow highlight
- ✅ **Filled questions** - Normal appearance
- 🎯 **Expanded** - Full editor visible
- 📦 **Collapsed** - Preview only

**Interactive Elements:**
- Hover effects on buttons
- Smooth transitions
- Loading spinners
- Confirmation dialogs

---

## 📊 Data Management

### Database Operations

**Jobs Table:**
```javascript
{
  id: UUID,
  title: string,
  description: string,
  default_questions: array,
  created_by: UUID (user),
  status: enum('active', 'inactive', 'archived'),
  created_at: timestamp,
  updated_at: timestamp
}
```

**Candidates Table:**
```javascript
{
  id: UUID,
  name: string,
  email: string,
  job_id: UUID (foreign key),
  access_token: string (unique),
  interview_link: string,
  custom_questions: array,
  status: enum('created', 'link_sent', 'in_progress', 'completed', 'reviewed'),
  hr_notes: text,
  created_at: timestamp,
  updated_at: timestamp
}
```

### Cascading Deletes

**When deleting a job:**
- All candidates for that job are deleted
- All interviews for those candidates are deleted
- All transcripts for those interviews are deleted

**When deleting a candidate:**
- All interviews for that candidate are deleted
- All transcripts for those interviews are deleted

---

## 🔒 Security & Permissions

### Row Level Security (RLS)

**HR Staff:**
- ✅ Can create/read/update/delete their own jobs
- ✅ Can manage candidates for their jobs only
- ✅ Cannot see other HR staff's data
- ✅ Full access to interview results for their candidates

**Candidates:**
- ✅ Access via unique token (no login required)
- ✅ Can only access their own interview
- ✅ Cannot see other candidates' data
- ❌ Cannot modify job or candidate data

---

## 🎯 Workflows

### Complete Hiring Workflow

```
1. HR Creates Job
   ↓
2. HR Adds Default Questions
   ↓
3. HR Adds Candidate
   ↓
4. System Generates Unique Link
   ↓
5. HR Sends Link to Candidate
   ↓
6. Candidate Clicks Link & Starts Interview
   ↓
7. AI Conducts Interview with Voice
   ↓
8. System Saves Transcript in Real-Time
   ↓
9. HR Reviews Interview with AI Analysis
   ↓
10. HR Updates Status to "Reviewed"
```

### Question Customization Workflow

**Using Default Questions:**
```
1. Create job with 5-10 default questions
2. Add candidate without custom questions
3. Candidate gets default questions automatically
```

**Using Custom Questions:**
```
1. Add candidate
2. Click "Customize Questions for This Candidate"
3. Edit/add/remove questions
4. Save candidate
5. Candidate gets custom questions only
```

---

## 💡 Best Practices

### For Jobs

**Naming:**
- Use clear, specific job titles
- Example: "Senior Frontend Developer" not "Developer"

**Questions:**
- 5-10 questions ideal
- Mix of technical and behavioral
- Keep questions concise
- Test questions before sending to candidates

### For Candidates

**Information:**
- Use professional email addresses
- Double-check spelling
- Add notes for internal reference

**Questions:**
- Customize for specific roles/seniority
- Consider candidate background
- Don't make questions too long

**Status Updates:**
- Keep status current
- Add HR notes for context
- Mark as "Link Sent" when sent

---

## 🐛 Troubleshooting

### Cannot Delete Job

**Error:** "Job has candidates"  
**Solution:** This is expected behavior. Deleting a job deletes all candidates (cascading delete). Confirm you want to proceed.

### Cannot Edit Candidate

**Error:** "Candidate not found"  
**Solution:** 
- Refresh the page
- Check if candidate was deleted
- Verify you're logged in

### Questions Not Saving

**Error:** Form not submitting  
**Solution:**
- Check for empty questions (yellow highlights)
- Fill in all questions or delete empty ones
- Ensure at least 1 question exists

### Interview Link Not Working

**Error:** "Invalid token"  
**Solution:**
- Check link was copied correctly
- Verify candidate exists in database
- Ensure token hasn't been tampered with
- Try generating a new candidate

---

## 🎨 Keyboard Shortcuts

### Question Editor
- **Enter** - Add new question (when focused on last question)
- **Tab** - Focus next question
- **Shift+Tab** - Focus previous question
- **Delete** - Remove empty question (when focused)

### Navigation
- **Ctrl/Cmd + F** - Search (browser default)
- **Esc** - Close modals/forms

---

## 📱 Responsive Design

### Desktop (>1024px)
- Two-column job grid
- Full question editor
- All features visible

### Tablet (768px-1024px)
- Single-column job grid
- Compact question editor
- Scrollable sections

### Mobile (<768px)
- Stack all elements
- Simplified question editor
- Touch-optimized buttons

---

## 🔄 Real-Time Updates

### Automatic Refresh
- Dashboard metrics update every 30 seconds
- Manual refresh button available
- Real-time status changes

### Change Detection
- Unsaved changes warning
- Auto-save for status updates
- Confirmation for destructive actions

---

## 📈 Analytics & Reporting

### Available Metrics

**Per Job:**
- Total candidates
- Completed interviews
- Average interview duration
- Question count

**Per Candidate:**
- Interview status
- Completion date
- AI score (1-10)
- Transcript word count

---

## 🚀 Advanced Features

### Bulk Operations (Future Enhancement)
- Import candidates from CSV
- Bulk status updates
- Export interview results
- Generate reports

### Question Templates (Future Enhancement)
- Save question sets
- Share templates between jobs
- Industry-specific questions
- Difficulty ratings

### Analytics Dashboard (Future Enhancement)
- Interview completion rates
- Average scores per job
- Time-to-hire metrics
- Candidate drop-off analysis

---

## 🎓 Training Resources

### For HR Staff

**Getting Started:**
1. Watch demo video (if available)
2. Create test job
3. Add test candidate
4. Complete mock interview
5. Review results

**Daily Operations:**
1. Check dashboard for updates
2. Review completed interviews
3. Update candidate statuses
4. Send interview links
5. Add HR notes

### For Candidates

**No Training Required:**
- Candidates receive link via email
- Simple "Start Interview" button
- Clear instructions throughout
- AI guides the entire process

---

## 📞 Support

### Common Questions

**Q: Can I recover deleted jobs?**  
A: No, deletions are permanent. Always confirm before deleting.

**Q: Can candidates edit questions?**  
A: No, candidates only answer questions. HR staff control all questions.

**Q: How many questions can I add?**  
A: Maximum 20 questions per job or candidate.

**Q: Can I reorder questions after creation?**  
A: Yes! Use drag-and-drop or up/down arrows in the question editor.

**Q: Do candidates see question numbers?**  
A: Yes, they see progress (e.g., "Question 3 of 10").

---

## ✅ Feature Checklist

### Jobs
- [x] Create job
- [x] Edit job (title, description, questions)
- [x] Delete job (with cascade)
- [x] View job list
- [x] See candidate count per job
- [x] Advanced question editor

### Candidates
- [x] Add candidate
- [x] Edit candidate (name, email, questions)
- [x] Delete candidate (with cascade)
- [x] Generate unique interview link
- [x] Copy link to clipboard
- [x] Update status
- [x] View interview results
- [x] Custom questions per candidate

### Questions
- [x] Add question
- [x] Edit question
- [x] Delete question
- [x] Reorder questions (drag-and-drop)
- [x] Duplicate question
- [x] Import questions (bulk)
- [x] Export questions
- [x] Character counter
- [x] Empty question warnings
- [x] Expand/collapse all

---

## 🎉 Summary

You now have **complete CRUD functionality** with:
- ✅ **Full control** over jobs and candidates
- ✅ **Advanced question management** with drag-and-drop
- ✅ **Professional UI** with visual feedback
- ✅ **Data safety** with confirmation dialogs
- ✅ **Efficient workflows** for HR staff

**Everything you need to manage AI interviews from start to finish!** 🚀
