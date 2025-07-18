import React, { useRef, useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import { Plus, Trash2 } from 'lucide-react';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

// Grading table: letter grade to grade point mapping
const gradingTable = [
  { min: 85, max: 100, grade: 'A+', point: 4.00 },
  { min: 84, max: 84, grade: 'A', point: 3.94 },
  { min: 83, max: 83, grade: 'A', point: 3.87 },
  { min: 82, max: 82, grade: 'A', point: 3.80 },
  { min: 81, max: 81, grade: 'A', point: 3.74 },
  { min: 80, max: 80, grade: 'A', point: 3.67 },
  { min: 79, max: 79, grade: 'B+', point: 3.60 },
  { min: 78, max: 78, grade: 'B+', point: 3.54 },
  { min: 77, max: 77, grade: 'B+', point: 3.47 },
  { min: 76, max: 76, grade: 'B+', point: 3.40 },
  { min: 75, max: 75, grade: 'B+', point: 3.34 },
  { min: 74, max: 74, grade: 'B', point: 3.27 },
  { min: 73, max: 73, grade: 'B', point: 3.20 },
  { min: 72, max: 72, grade: 'B', point: 3.14 },
  { min: 71, max: 71, grade: 'B', point: 3.07 },
  { min: 70, max: 70, grade: 'B', point: 3.00 },
  { min: 69, max: 69, grade: 'C+', point: 2.95 },
  { min: 68, max: 68, grade: 'C+', point: 2.90 },
  { min: 67, max: 67, grade: 'C+', point: 2.85 },
  { min: 66, max: 66, grade: 'C+', point: 2.80 },
  { min: 65, max: 65, grade: 'C+', point: 2.75 },
  { min: 64, max: 64, grade: 'C', point: 2.70 },
  { min: 63, max: 63, grade: 'C', point: 2.65 },
  { min: 62, max: 62, grade: 'C', point: 2.60 },
  { min: 61, max: 61, grade: 'C', point: 2.55 },
  { min: 60, max: 60, grade: 'C', point: 2.50 },
  { min: 59, max: 59, grade: 'C−', point: 2.40 },
  { min: 58, max: 58, grade: 'C−', point: 2.30 },
  { min: 57, max: 57, grade: 'C−', point: 2.20 },
  { min: 56, max: 56, grade: 'C−', point: 2.10 },
  { min: 55, max: 55, grade: 'C−', point: 2.00 },
  { min: 54, max: 54, grade: 'D', point: 1.90 },
  { min: 53, max: 53, grade: 'D', point: 1.80 },
  { min: 52, max: 52, grade: 'D', point: 1.70 },
  { min: 51, max: 51, grade: 'D', point: 1.60 },
  { min: 50, max: 50, grade: 'D', point: 1.50 },
  { min: 0, max: 49, grade: 'F', point: 0.00 },
  // Special cases (non-credit, in progress, etc.) can be handled separately
];

// Remarks mapping for letter grades
const gradeRemarks = {
  'A+': 'Excellent',
  'A': 'Very Good',
  'B+': 'Good',
  'B': 'Fair',
  'C+': 'Average',
  'C': 'Satisfactory',
  'C−': 'Adequate',
  'D': 'Pass',
  'F': 'Fail',
};

function App() {
  // Refs for navigation
  const heroRef = useRef(null);
  const gradeEntryRef = useRef(null);
  const gradeTableRef = useRef(null);
  const contactRef = useRef(null);

  // State for courses
  const [courses, setCourses] = useState([
    { name: '', marks: '', credit: '' }
  ]);

  // State for previous CGPA and credits
  const [prevCgpa, setPrevCgpa] = useState('');
  const [prevCredits, setPrevCredits] = useState('');

  // State for multiple semesters
  const [semesters, setSemesters] = useState(() => {
    const saved = localStorage.getItem('semesters');
    return saved ? JSON.parse(saved) : [];
  });
  // Track current semester index (for display)
  const [currentSemester, setCurrentSemester] = useState(semesters.length + 1);
  // Track which semester is selected for viewing/editing
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);

  // Save semesters to localStorage
  useEffect(() => {
    localStorage.setItem('semesters', JSON.stringify(semesters));
  }, [semesters]);

  // Save current semester
  const handleSaveSemester = () => {
    if (!courses.length) return;
    const gpa = calculateGPA();
    const totalCredits = courses.reduce((sum, c) => {
      const credit = parseFloat(c.credit);
      const marks = parseFloat(c.marks);
      const gradeObj = gradingTable.find(g => marks >= g.min && marks <= g.max);
      return gradeObj && !isNaN(marks) && credit > 0 ? sum + credit : sum;
    }, 0);
    setSemesters([
      ...semesters,
      {
        id: semesters.length + 1,
        courses: [...courses],
        gpa,
        totalCredits,
      },
    ]);
    setCurrentSemester(semesters.length + 2);
  };

  // Add new semester (clear form)
  const handleAddNewSemester = () => {
    setCourses([{ name: '', marks: '', credit: '' }]);
  };

  // Remove a course row
  const handleRemoveCourse = (idx) => {
    setCourses(courses.filter((_, i) => i !== idx));
  };

  // Update course field
  const handleCourseChange = (idx, field, value) => {
    const updated = courses.map((course, i) =>
      i === idx ? { ...course, [field]: value } : course
    );
    setCourses(updated);
  };

  // Add a new course row
  const handleAddCourse = () => {
    setCourses([...courses, { name: '', marks: '', credit: '' }]);
  };

  // GPA calculation
  const calculateGPA = () => {
    let totalPoints = 0;
    let totalCredits = 0;
    courses.forEach(course => {
      const marks = parseFloat(course.marks);
      const credit = parseFloat(course.credit);
      const gradeObj = gradingTable.find(g => marks >= g.min && marks <= g.max);
      if (gradeObj && !isNaN(marks) && credit > 0) {
        totalPoints += gradeObj.point * credit;
        totalCredits += credit;
      }
    });
    if (totalCredits === 0) return '';
    return (totalPoints / totalCredits).toFixed(2);
  };

  const semesterGPA = calculateGPA();

  // CGPA calculation
  const calculateCgpa = () => {
    const prevCgpaNum = parseFloat(prevCgpa);
    const prevCreditsNum = parseFloat(prevCredits);
    const semCredits = courses.reduce((sum, c) => {
      const credit = parseFloat(c.credit);
      const marks = parseFloat(c.marks);
      const gradeObj = gradingTable.find(g => marks >= g.min && marks <= g.max);
      return gradeObj && !isNaN(marks) && credit > 0 ? sum + credit : sum;
    }, 0);
    const semGpaNum = parseFloat(semesterGPA);
    if (
      isNaN(prevCgpaNum) ||
      isNaN(prevCreditsNum) ||
      isNaN(semGpaNum) ||
      prevCreditsNum < 0 ||
      semCredits === 0
    ) {
      return '';
    }
    const totalPoints = prevCgpaNum * prevCreditsNum + semGpaNum * semCredits;
    const totalCredits = prevCreditsNum + semCredits;
    if (totalCredits === 0) return '';
    return (totalPoints / totalCredits).toFixed(2);
  };

  const updatedCgpa = calculateCgpa();

  // Calculate overall CGPA from all semesters
  const calculateOverallCgpa = () => {
    if (!semesters.length) return '';
    let totalPoints = 0;
    let totalCredits = 0;
    semesters.forEach(sem => {
      const gpa = parseFloat(sem.gpa);
      const credits = parseFloat(sem.totalCredits);
      if (!isNaN(gpa) && !isNaN(credits) && credits > 0) {
        totalPoints += gpa * credits;
        totalCredits += credits;
      }
    });
    if (totalCredits === 0) return '';
    return (totalPoints / totalCredits).toFixed(2);
  };
  const overallCgpa = calculateOverallCgpa();

  // When a saved semester is clicked, load its courses into the form
  const handleLoadSemester = (sem) => {
    setCourses(sem.courses.map(c => ({ ...c }))); // deep copy
    setCurrentSemester(sem.id);
    setSelectedSemesterId(sem.id);
  };

  // Delete a semester
  const handleDeleteSemester = (id) => {
    setSemesters(semesters.filter(sem => sem.id !== id));
    if (selectedSemesterId === id) {
      setCourses([{ name: '', marks: '', credit: '' }]);
      setSelectedSemesterId(null);
      setCurrentSemester(semesters.length);
    }
  };

  // Update the selected semester with current form data
  const handleUpdateSemester = () => {
    if (!selectedSemesterId) return;
    const gpa = calculateGPA();
    const totalCredits = courses.reduce((sum, c) => {
      const credit = parseFloat(c.credit);
      const marks = parseFloat(c.marks);
      const gradeObj = gradingTable.find(g => marks >= g.min && marks <= g.max);
      return gradeObj && !isNaN(marks) && credit > 0 ? sum + credit : sum;
    }, 0);
    setSemesters(semesters.map(sem =>
      sem.id === selectedSemesterId
        ? { ...sem, courses: [...courses], gpa, totalCredits }
        : sem
    ));
  };

  // Scroll handler
  const handleNavClick = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Helper to calculate total obtained and total possible for a semester (sum of marks, total = num courses * 100)
  const getSemesterTotals = (sem) => {
    let obtained = 0;
    sem.courses.forEach(c => {
      const marks = parseFloat(c.marks);
      if (!isNaN(marks)) {
        obtained += marks;
      }
    });
    const possible = sem.courses.length * 100;
    return { obtained, possible };
  };

  // Download semesters as PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont('Poppins', 'normal');
    doc.setFontSize(18);
    doc.text('UMW Grading Portal - Saved Semesters', 14, 16);
    let y = 26;
    semesters.forEach((sem, idx) => {
      doc.setFontSize(14);
      doc.text(`Semester ${idx + 1} (GPA: ${sem.gpa}, Credits: ${sem.totalCredits})`, 14, y);
      y += 6;
      const totals = getSemesterTotals(sem);
      doc.setFontSize(11);
      doc.text(`Total Obtained: ${totals.obtained} / ${totals.possible}`, 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Course', 'Marks', 'Credit Hours']],
        body: sem.courses.map(c => [c.name, c.marks, c.credit]),
        theme: 'grid',
        headStyles: { fillColor: [255, 152, 0] },
        styles: { font: 'Poppins', fontSize: 10 },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 8;
    });
    doc.save('All-Semesters.pdf');
  };

  // Handle drag end for semesters
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(semesters);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setSemesters(reordered);
  };

  // Handle move semester up
  const handleMoveSemesterUp = (id) => {
    const currentIndex = semesters.findIndex(sem => sem.id === id);
    if (currentIndex > 0) {
      const [movedSemester] = semesters.splice(currentIndex, 1);
      semesters.splice(currentIndex - 1, 0, movedSemester);
      setSemesters([...semesters]);
    }
  };

  // Handle move semester down
  const handleMoveSemesterDown = (id) => {
    const currentIndex = semesters.findIndex(sem => sem.id === id);
    if (currentIndex < semesters.length - 1) {
      const [movedSemester] = semesters.splice(currentIndex, 1);
      semesters.splice(currentIndex + 1, 0, movedSemester);
      setSemesters([...semesters]);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="inherit" elevation={1} sx={{ background: '#f0f0f0', color: '#d35400', fontFamily: 'Poppins' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="logo" sx={{ mr: 2 }} onClick={() => handleNavClick(heroRef)}>
            <img src={process.env.PUBLIC_URL + '/calculator-icon.png'} alt="Calculator Logo" style={{ height: 40 }} />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 1 }}>
            Grading Portal
          </Typography>
          <Button color="inherit" sx={{ fontWeight: 500, fontFamily: 'Poppins' }} onClick={() => handleNavClick(heroRef)}>Home</Button>
          <Button color="inherit" sx={{ fontWeight: 500, fontFamily: 'Poppins' }} onClick={() => handleNavClick(gradeEntryRef)}>GPA Calculator</Button>
          <Button color="inherit" sx={{ fontWeight: 500, fontFamily: 'Poppins' }} onClick={() => handleNavClick(gradeTableRef)}>Grade Table</Button>
        </Toolbar>
      </AppBar>
      {/* Hero section and main content will go here */}
      <Box ref={heroRef} className="snap-section" sx={{
        width: '100%',
        minHeight: { xs: 320, md: 420 },
        background: `linear-gradient(90deg, rgba(107, 89, 62, 0.79) 10%, rgba(114, 101, 91, 0.23) 100%), url('https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=1200&q=80') center/cover no-repeat`,
        py: { xs: 6, md: 8 },
        px: { xs: 2, md: 0 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        boxShadow: 1,
        mb: 4,
        scrollSnapAlign: 'start',
      }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: '#d35400', fontFamily: 'Poppins', textAlign: 'center'}}>
          Welcome to the Grading Portal
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, color: '#ff9800', fontFamily: 'Poppins', textAlign: 'center' }}>
          Track your academic performance, calculate your GPA, and stay on top of your goals.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            sx={{ background: '#ff9800', color: '#fff', fontWeight: 600, fontFamily: 'Poppins', borderRadius: 3, px: 4, boxShadow: 2, '&:hover': { background: '#d35400' } }}
            onClick={() => handleNavClick(gradeEntryRef)}
          >
            Calculate GPA
          </Button>
          <Button
            variant="outlined"
            size="large"
            sx={{ color: '#d35400', borderColor: '#d35400', fontWeight: 600, fontFamily: 'Poppins', borderRadius: 3, px: 4, boxShadow: 2, '&:hover': { borderColor: '#ff9800', color: '#ff9800' } }}
            onClick={() => handleNavClick(gradeTableRef)}
          >
            View Grading Policy
          </Button>
        </Box>
      </Box>
      {/* Main content cards */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 4,
        justifyContent: 'center',
        alignItems: 'flex-start',
        px: { xs: 2, md: 6 },
        mb: 6,
      }}>
        {/* Grade Entry Card */}
        <Box ref={gradeEntryRef} sx={{ flex: 1, minWidth: 320 }}>
          <Card sx={{ borderRadius: 4, boxShadow: 3, p: 3 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#d35400', mb: 2, fontFamily: 'Poppins' }}>
                Grade Entry (Semester {currentSemester})
              </Typography>
              {/* Grade entry form */}
              <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 1, mb: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ background: '#f0f0f0' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Course Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Marks</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Credit Hours</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {courses.map((course, idx) => (
                      <TableRow key={idx} sx={{ background: idx % 2 === 0 ? '#f7f7f7' : '#f0f0f0' }}>
                        <TableCell>
                          <TextField
                            variant="outlined"
                            size="small"
                            value={course.name}
                            onChange={e => handleCourseChange(idx, 'name', e.target.value)}
                            placeholder="e.g. Calculus"
                            sx={{ background: '#fff', borderRadius: 2 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            variant="outlined"
                            size="small"
                            type="number"
                            value={course.marks}
                            onChange={e => handleCourseChange(idx, 'marks', e.target.value)}
                            placeholder="e.g. 85"
                            sx={{ background: '#fff', borderRadius: 2, width: 110 }} // wider marks input
                            inputProps={{ min: 0, max: 100 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            variant="outlined"
                            size="small"
                            type="number"
                            value={course.credit}
                            onChange={e => handleCourseChange(idx, 'credit', e.target.value)}
                            placeholder="e.g. 3"
                            sx={{ background: '#fff', borderRadius: 2, width: 60 }} // narrower credit input
                            inputProps={{ min: 0 }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton color="error" onClick={() => handleRemoveCourse(idx)} disabled={courses.length === 1}>
                            <Trash2 size={20} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Plus size={22} />}
                  onClick={handleAddCourse}
                  sx={{
                    background: 'linear-gradient(90deg, #ff9800 60%, #d35400 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    fontFamily: 'Poppins',
                    borderRadius: 3,
                    boxShadow: 3,
                    px: 4,
                    py: 1.5,
                    fontSize: 18,
                    letterSpacing: 0.5,
                    transition: 'all 0.2s',
                    '&:hover': { background: 'linear-gradient(90deg, #d35400 60%, #ff9800 100%)', boxShadow: 6 },
                    '&:focus': { outline: '2px solid #ff9800' },
                  }}
                >
                  Add Course
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleAddNewSemester}
                  sx={{
                    color: '#d35400',
                    borderColor: '#d35400',
                    fontWeight: 600,
                    fontFamily: 'Poppins',
                    borderRadius: 3,
                    boxShadow: 2,
                    px: 4,
                    py: 1.5,
                    fontSize: 18,
                    letterSpacing: 0.5,
                    background: '#fff',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: '#ff9800', color: '#ff9800', background: '#f0f0f0' },
                    '&:focus': { outline: '2px solid #ff9800' },
                  }}
                >
                  Add New Semester
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  color="success"
                  onClick={handleSaveSemester}
                  sx={{
                    fontWeight: 600,
                    fontFamily: 'Poppins',
                    borderRadius: 3,
                    boxShadow: 3,
                    px: 4,
                    py: 1.5,
                    fontSize: 18,
                    letterSpacing: 0.5,
                    background: 'linear-gradient(90deg, #43a047 60%, #388e3c 100%)',
                    color: '#fff',
                    transition: 'all 0.2s',
                    '&:hover': { background: 'linear-gradient(90deg, #388e3c 60%, #43a047 100%)', boxShadow: 6 },
                    '&:focus': { outline: '2px solid #43a047' },
                  }}
                >
                  Save Semester
                </Button>
                {selectedSemesterId && (
                  <Button
                    variant="contained"
                    size="large"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={handleUpdateSemester}
                    sx={{
                      fontWeight: 600,
                      fontFamily: 'Poppins',
                      borderRadius: 3,
                      boxShadow: 3,
                      px: 4,
                      py: 1.5,
                      fontSize: 18,
                      letterSpacing: 0.5,
                      background: 'linear-gradient(90deg, #ff9800 60%, #d35400 100%)',
                      color: '#fff',
                      transition: 'all 0.2s',
                      '&:hover': { background: 'linear-gradient(90deg, #d35400 60%, #ff9800 100%)', boxShadow: 6 },
                      '&:focus': { outline: '2px solid #ff9800' },
                    }}
                  >
                    Update Semester
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
        {/* GPA Result Card */}
        <Box sx={{ flex: 1, minWidth: 320 }}>
          <Card sx={{ borderRadius: 4, boxShadow: 3, p: 3 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#d35400', mb: 2, fontFamily: 'Poppins' }}>
                GPA Result
              </Typography>
              {/* GPA result display */}
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800', fontFamily: 'Poppins' }}>
                  {semesterGPA !== '' ? `Semester GPA: ${semesterGPA}` : 'Enter your courses to calculate GPA.'}
                </Typography>
              </Box>
              {/* Semester summary table */}
              {semesters.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#d35400', fontFamily: 'Poppins', mb: 1 }}>
                    Saved Semesters
                  </Typography>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="semesters-droppable">
                      {(provided) => (
                        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 0 }}
                          ref={provided.innerRef} {...provided.droppableProps}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ background: '#f0f0f0' }}>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>Semester</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>GPA</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>Total Credits</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>Total Obtained</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {semesters.map((sem, idx) => {
                                const totals = getSemesterTotals(sem);
                                return (
                                  <Draggable key={sem.id} draggableId={sem.id.toString()} index={idx}>
                                    {(provided, snapshot) => (
                                      <TableRow
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        onClick={() => handleLoadSemester(sem)}
                                        sx={{
                                          background: sem.id === selectedSemesterId ? '#ffe0b2' : (idx % 2 === 0 ? '#f7f7f7' : '#f0f0f0'),
                                          cursor: 'pointer',
                                          transition: 'background 0.2s',
                                          '&:hover': { background: '#ffcc80' },
                                          boxShadow: snapshot.isDragging ? 4 : 0,
                                        }}
                                      >
                                        <TableCell align="center">{idx + 1}</TableCell>
                                        <TableCell align="center">{sem.gpa}</TableCell>
                                        <TableCell align="center">{sem.totalCredits}</TableCell>
                                        <TableCell align="center">{`${totals.obtained} / ${totals.possible}`}</TableCell>
                                        <TableCell align="center" padding="none">
                                          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                            {/* Container 1: Delete button */}
                                            <Box>
                                              <IconButton
                                                size="small"
                                                color="error"
                                                onClick={e => { e.stopPropagation(); handleDeleteSemester(sem.id); }}
                                              >
                                                <DeleteIcon fontSize="small" />
                                              </IconButton>
                                            </Box>
                                            {/* Container 2: Up/Down arrows */}
                                            {selectedSemesterId === sem.id && (
                                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <IconButton
                                                  size="small"
                                                  color="primary"
                                                  onClick={e => { e.stopPropagation(); handleMoveSemesterUp(sem.id); }}
                                                  disabled={idx === 0}
                                                  sx={{ mb: 0.5 }}
                                                >
                                                  <ArrowUpwardIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                  size="small"
                                                  color="primary"
                                                  onClick={e => { e.stopPropagation(); handleMoveSemesterDown(sem.id); }}
                                                  disabled={idx === semesters.length - 1}
                                                >
                                                  <ArrowDownwardIcon fontSize="small" />
                                                </IconButton>
                                              </Box>
                                            )}
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Droppable>
                  </DragDropContext>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleDownloadPDF}
                      sx={{ fontWeight: 600, fontFamily: 'Poppins', borderRadius: 3, boxShadow: 2, px: 4, py: 1.5, fontSize: 16, letterSpacing: 0.5, background: 'linear-gradient(90deg, #ff9800 60%, #d35400 100%)', color: '#fff', transition: 'all 0.2s', '&:hover': { background: 'linear-gradient(90deg, #d35400 60%, #ff9800 100%)', boxShadow: 4 } }}
                    >
                      Download PDF
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
        {/* CGPA Update Card */}
        <Box sx={{ flex: 1, minWidth: 320 }}>
          <Card sx={{ borderRadius: 4, boxShadow: 3, p: 3 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#d35400', mb: 2, fontFamily: 'Poppins' }}>
                CGPA Update
              </Typography>
              {/* CGPA update form */}
              {semesters.length > 0 ? (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff9800', fontFamily: 'Poppins' }}>
                    Overall CGPA: {overallCgpa}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                  <TextField
                    label="Previous CGPA"
                    variant="outlined"
                    size="small"
                    value={prevCgpa}
                    onChange={e => setPrevCgpa(e.target.value)}
                    placeholder="e.g. 3.45"
                    sx={{ background: '#fff', borderRadius: 2 }}
                    inputProps={{ min: 0, max: 4, step: 0.01 }}
                  />
                  <TextField
                    label="Previous Total Credits"
                    variant="outlined"
                    size="small"
                    value={prevCredits}
                    onChange={e => setPrevCredits(e.target.value)}
                    placeholder="e.g. 90"
                    sx={{ background: '#fff', borderRadius: 2 }}
                    inputProps={{ min: 0, step: 1 }}
                  />
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff9800', fontFamily: 'Poppins' }}>
                      {updatedCgpa !== '' ? `Updated CGPA: ${updatedCgpa}` : 'Enter previous CGPA and credits to update.'}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
      {/* Placeholder for Grade Table section */}
      <Box ref={gradeTableRef} sx={{ maxWidth: 900, mx: 'auto', mb: 8 }}>
        <Card sx={{ borderRadius: 4, boxShadow: 3, p: 3 }}>
          <CardContent>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#d35400', mb: 2, fontFamily: 'Poppins' }}>
              Grading Table
            </Typography>
            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 1, mb: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: '#f0f0f0' }}>
                    <TableCell sx={{ fontWeight: 600 }}>% Marks</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Grade Point</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Letter Grade</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gradingTable.map((row, idx) => (
                    <TableRow key={idx} sx={{ background: idx % 2 === 0 ? '#f7f7f7' : '#f0f0f0' }}>
                      <TableCell>{row.min === row.max ? row.min : `${row.min}–${row.max}`}</TableCell>
                      <TableCell>{row.point.toFixed(2)}</TableCell>
                      <TableCell>{row.grade}</TableCell>
                      <TableCell>{gradeRemarks[row.grade] || ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
      {/* Placeholder for Contact/footer section */}
      <Box ref={contactRef} className="snap-section" sx={{ background: '#f0f0f0', py: 4, mt: 8 }}>
        <Box sx={{ maxWidth: 900, mx: 'auto', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 2 }}>
          <Typography variant="body2" sx={{ color: '#d35400', fontFamily: 'Poppins', fontWeight: 500 }}>
            © {new Date().getFullYear()} Mona DevDizyn | All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Button color="inherit" sx={{ fontWeight: 500, fontFamily: 'Poppins', textTransform: 'none' }} onClick={() => handleNavClick(heroRef)}>Home</Button>
            <Button color="inherit" sx={{ fontWeight: 500, fontFamily: 'Poppins', textTransform: 'none' }} onClick={() => handleNavClick(gradeEntryRef)}>GPA Calculator</Button>
            <Button color="inherit" sx={{ fontWeight: 500, fontFamily: 'Poppins', textTransform: 'none' }} onClick={() => handleNavClick(gradeTableRef)}>Grade Table</Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
