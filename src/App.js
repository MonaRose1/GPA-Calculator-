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
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navLinks = [
    { label: 'Home', ref: heroRef },
    { label: 'GPA Calculator', ref: gradeEntryRef },
    { label: 'Grade Table', ref: gradeTableRef },
  ];
  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen);
  const handleDrawerNav = (ref) => {
    setDrawerOpen(false);
    handleNavClick(ref);
  };

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
    <Box sx={{ flexGrow: 1, width: '100%' }}>
      {/* Responsive Navbar */}
      <AppBar position="static" sx={{ background: '#fff', color: '#d35400', boxShadow: 2 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: { xs: 1, sm: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img src={process.env.PUBLIC_URL + '/calculator-icon.png'} alt="Logo" style={{ height: 36, marginRight: 12 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Poppins', letterSpacing: 1, color: '#d35400', fontSize: { xs: '1.1rem', sm: '1.3rem' } }}>
              GPA Calculator
            </Typography>
          </Box>
          {/* Desktop Nav */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
            {navLinks.map((item) => (
              <Button key={item.label} color="inherit" sx={{ fontWeight: 500, fontFamily: 'Poppins', textTransform: 'none', fontSize: '1rem' }} onClick={() => handleNavClick(item.ref)}>
                {item.label}
              </Button>
            ))}
          </Box>
          {/* Mobile Nav */}
          <IconButton edge="end" color="inherit" aria-label="menu" onClick={handleDrawerToggle} sx={{ display: { xs: 'flex', md: 'none' } }}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer anchor="right" open={drawerOpen} onClose={handleDrawerToggle} sx={{ display: { xs: 'block', md: 'none' } }}>
        <Box sx={{ width: 220 }} role="presentation" onClick={handleDrawerToggle}>
          <List>
            {navLinks.map((item) => (
              <ListItem key={item.label} disablePadding>
                <ListItemButton onClick={() => handleDrawerNav(item.ref)}>
                  <ListItemText primary={item.label} sx={{ fontFamily: 'Poppins', fontWeight: 500, color: '#d35400' }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      {/* Hero section and main content will go here */}
      <Box ref={heroRef} className="snap-section" sx={{
        width: '100%',
        minHeight: { xs: 200, md: 420 },
        background: `linear-gradient(90deg, rgba(107, 89, 62, 0.79) 10%, rgba(114, 101, 91, 0.23) 100%), url('https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=1200&q=80') center/cover no-repeat`,
        py: { xs: 3, md: 8 },
        px: { xs: 0, md: 0 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        boxShadow: 1,
        mb: 4,
        scrollSnapAlign: 'start',
      }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: '#d35400', fontFamily: 'Poppins', textAlign: 'center', fontSize: { xs: '1.5rem', sm: '2.2rem', md: '2.8rem' } }}>
          Welcome to the Grading Portal
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, color: '#ff9800', fontFamily: 'Poppins', textAlign: 'center', fontSize: { xs: '1rem', sm: '1.2rem', md: '1.3rem' } }}>
          Track your academic performance, calculate your GPA, and stay on top of your goals.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 400, mx: 'auto', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            sx={{ background: '#ff9800', color: '#fff', fontWeight: 600, fontFamily: 'Poppins', borderRadius: 3, px: 4, boxShadow: 2, width: '14rem', height: '3rem', mb: { xs: 1, sm: 0 }, '&:hover': { background: '#d35400' } }}
            onClick={() => handleNavClick(gradeEntryRef)}
          >
            Calculate GPA
          </Button>
          <Button
            variant="outlined"
            size="large"
            sx={{ color: '#d35400', borderColor: '#d35400', fontWeight: 600, fontFamily: 'Poppins', borderRadius: 3, px: 4, boxShadow: 2, width: '14rem', height: '3rem', '&:hover': { borderColor: '#ff9800', color: '#ff9800' } }}
            onClick={() => handleNavClick(gradeTableRef)}
          >
            View Grading Policy
          </Button>
        </Box>
      </Box>
      {/* Main content cards*/}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          gap: { xs: 4, lg: 6 },
          alignItems: 'stretch',
          width: '100%',
          maxWidth: 1400,
          mx: 'auto',
          mb: 8,
        }}
      >
        {/* Grade Entry Card */}
        <Box
          ref={gradeEntryRef}
          sx={{
            flex: 1,
            minWidth: { xs: '80%', sm: 300, md: 300, lg: 400 },
            maxWidth: '100%',
            width: { xs: '85%', md: '33%', lg: '33%' },
            mx: { xs: 1, lg: 1 },
            mb: { xs: 2, lg: 0 },
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Card
            sx={{
              borderRadius: 6,
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid #ececec',
              p: { xs: 2, md: 3 }, // reduced padding
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'stretch',
              transition: 'box-shadow 0.2s, transform 0.2s',
              '&:hover': {
                boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.18)',
                transform: 'translateY(-2px) scale(1.01)',
              },
            }}
          >
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#222', fontFamily: 'Poppins', fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' } }}>
                  Grade Entry (Semester {currentSemester})
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {/* Grade entry form */}
              <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 0, mb: 2, width: '100%', background: 'transparent' }}>
                <Table size="small" sx={{ width: '100%' }}>
                  <TableHead>
                    <TableRow sx={{ background: '#f7f8fa' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1.1rem' } }}>Course Name</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1.1rem' } }}>Marks</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1.1rem' } }}>Credit Hours</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {courses.map((course, idx) => (
                      <TableRow key={idx} sx={{ background: idx % 2 === 0 ? '#fafbfc' : '#f7f8fa' }}>
                        <TableCell sx={{ width: '100%' }}>
                          <TextField
                            variant="outlined"
                            size="small"
                            value={course.name}
                            onChange={e => handleCourseChange(idx, 'name', e.target.value)}
                            placeholder="e.g. Calculus"
                            sx={{ background: '#fff', borderRadius: 2, width: '100%', fontSize: '1.05rem', input: { py: 1.2 } }}
                            inputProps={{ style: { fontSize: '1.05rem', padding: '12px 10px' } }}
                          />
                        </TableCell>
                        <TableCell sx={{ width: '100%' }}>
                          <TextField
                            variant="outlined"
                            size="small"
                            type="number"
                            value={course.marks}
                            onChange={e => handleCourseChange(idx, 'marks', e.target.value)}
                            placeholder="e.g. 85"
                            sx={{ background: '#fff', borderRadius: 2, width: '100%', fontSize: '1.05rem', input: { py: 1.2 } }}
                            inputProps={{ min: 0, max: 100, style: { fontSize: '1.05rem', padding: '12px 10px' } }}
                          />
                        </TableCell>
                        <TableCell sx={{ width: '100%' }}>
                          <TextField
                            variant="outlined"
                            size="small"
                            type="number"
                            value={course.credit}
                            onChange={e => handleCourseChange(idx, 'credit', e.target.value)}
                            placeholder="e.g. 3"
                            sx={{ background: '#fff', borderRadius: 2, width: '100%', fontSize: '1.05rem', input: { py: 1.2 } }}
                            inputProps={{ min: 0, style: { fontSize: '1.05rem', padding: '12px 10px' } }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Remove Course">
                            <IconButton color="error" onClick={() => handleRemoveCourse(idx)} disabled={courses.length === 1}>
                              <Trash2 size={20} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row', md: 'row' }, gap: 2, width: { xs: '100%', sm: '80%', md: 'auto' }, mb: 2, justifyContent: { xs: 'center', sm: 'flex-start' }, alignItems: { xs: 'center', sm: 'flex-start' } }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Plus size={22} />}
                  onClick={handleAddCourse}
                  sx={{
                    background: 'linear-gradient(90deg, #ff9800 60%, #d35400 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    fontFamily: 'Poppins',
                    borderRadius: 99,
                    boxShadow: 2,
                    px: 3,
                    py: 1.5,
                    letterSpacing: 0.5,
                    width: { xs: '90%', lg: '12rem' }, // 90% width on mobile, fixed on desktop
                    minWidth: 120,
                    maxWidth: 200,
                    mb: { xs: 1, lg: 0 }, // vertical gap on mobile
                    mx: 'auto', // horizontal gap on desktop
                    fontSize: { xs: '1.05rem', sm: '1.15rem', md: '1.15rem' },
                    transition: 'all 0.2s',
                    '&:hover': { background: 'linear-gradient(90deg, #d35400 60%, #ff9800 100%)', boxShadow: 4 },
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
                    fontWeight: 700,
                    fontFamily: 'Poppins',
                    borderRadius: 99,
                    boxShadow: 2,
                    px: 3,
                    py: 1.5,
                    letterSpacing: 0.5,
                    width: { xs: '90%', lg: '12rem' }, // 90% width on mobile, fixed on desktop
                    minWidth: 120,
                    maxWidth: 200,
                    mb: { xs: 1, lg: 0 }, // vertical gap on mobile
                    mx: 'auto', // horizontal gap on desktop
                    fontSize: { xs: '1.05rem', sm: '1.15rem', md: '1.15rem' },
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: '#ff9800', color: '#ff9800', boxShadow: 4 },
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
                    fontWeight: 700,
                    fontFamily: 'Poppins',
                    borderRadius: 99,
                    boxShadow: 2,
                    px: 3,
                    py: 1.5,
                    fontSize: { xs: '1.05rem', sm: '1.15rem', md: '1.15rem' },
                    letterSpacing: 0.5,
                    background: 'linear-gradient(90deg, #43a047 60%, #388e3c 100%)',
                    color: '#fff',
                    width: { xs: '90%', lg: '12rem' }, // 90% width on mobile, fixed on desktop
                    minWidth: 120,
                    maxWidth: 200,
                    mb: { xs: 1, lg: 0 }, // vertical gap on mobile
                    mx: 'auto', 
                    transition: 'all 0.2s',
                    '&:hover': { background: 'linear-gradient(90deg, #388e3c 60%, #43a047 100%)', boxShadow: 4 },
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
                      fontWeight: 700,
                      fontFamily: 'Poppins',
                      borderRadius: 99,
                      boxShadow: 2,
                      px: 3,
                      py: 1.5,
                      letterSpacing: 0.5,
                      width: { xs: '90%', lg: '9rem' }, // 90% width on mobile, fixed on desktop
                      minWidth: 120,
                      maxWidth: 200,
                      mb: { xs: 1, lg: 0 }, // vertical gap on mobile
                      mx: 'auto', // horizontal gap on desktop
                      fontSize: { xs: '1.05rem', sm: '1.15rem', md: '1.15rem' },
                      background: 'linear-gradient(90deg, #ff9800 60%, #d35400 100%)',
                      color: '#fff',
                      transition: 'all 0.2s',
                      '&:hover': { background: 'linear-gradient(90deg, #d35400 60%, #ff9800 100%)', boxShadow: 4 },
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
        <Box
          sx={{
            flex: 1,
            minWidth: { xs: '80%', sm: 300, md: 300, lg: 400 },
            maxWidth: '100%',
            width: { xs: '85%', md: '33%', lg: '33%' },
            mx: { xs: 1, lg: 1 },
            mb: { xs: 2, lg: 0 },
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Card
            sx={{
              borderRadius: 6,
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid #ececec',
              p: { xs: 2, md: 3 },
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'stretch',
              transition: 'box-shadow 0.2s, transform 0.2s',
              '&:hover': {
                boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.18)',
                transform: 'translateY(-2px) scale(1.01)',
              },
            }}
          >
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#222', fontFamily: 'Poppins', fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' } }}>
                  GPA Result
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {/* GPA result display */}
              <Box sx={{ mt: 2, mb: 2, width: '100%' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800', fontFamily: 'Poppins', wordBreak: 'break-word', fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' } }}>
                  {semesterGPA !== '' ? `Semester GPA: ${semesterGPA}` : 'Enter your courses to calculate GPA.'}
                </Typography>
              </Box>
              {/* Semester summary table */}
              {semesters.length > 0 && (
                <Box sx={{ mt: 3, width: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#d35400', fontFamily: 'Poppins', mb: 1, fontSize: { xs: '1.05rem', sm: '1.15rem' } }}>
                    Saved Semesters
                  </Typography>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="semesters-droppable">
                      {(provided) => (
                        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 0, width: '100%', background: 'transparent' }}
                          ref={provided.innerRef} {...provided.droppableProps}>
                          <Table size="small" sx={{ width: '100%', tableLayout: 'auto' }}>
                            <TableHead>
                              <TableRow sx={{ background: '#f7f8fa' }}>
                                <TableCell align="center" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.1rem' } }}>Semester</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.1rem' } }}>GPA</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.1rem' } }}>Total Credits</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.1rem' } }}>Total Obtained</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.1rem' } }}>Actions</TableCell>
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
                                          background: sem.id === selectedSemesterId ? '#ffe0b2' : (idx % 2 === 0 ? '#fafbfc' : '#f7f8fa'),
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
                                              <Tooltip title="Delete Semester">
                                                <IconButton
                                                  size="small"
                                                  color="error"
                                                  onClick={e => { e.stopPropagation(); handleDeleteSemester(sem.id); }}
                                                >
                                                  <DeleteIcon fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
                                            </Box>
                                            {/* Container 2: Up/Down arrows */}
                                            {selectedSemesterId === sem.id && (
                                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <Tooltip title="Move Up">
                                                  <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={e => { e.stopPropagation(); handleMoveSemesterUp(sem.id); }}
                                                    disabled={idx === 0}
                                                    sx={{ mb: 0.5 }}
                                                  >
                                                    <ArrowUpwardIcon fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Move Down">
                                                  <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={e => { e.stopPropagation(); handleMoveSemesterDown(sem.id); }}
                                                    disabled={idx === semesters.length - 1}
                                                  >
                                                    <ArrowDownwardIcon fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>
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
                      sx={{ fontWeight: 700, fontFamily: 'Poppins', borderRadius: 99, boxShadow: 2, px: 4, py: 1.5, fontSize: 18, letterSpacing: 0.5, background: 'linear-gradient(90deg, #ff9800 60%, #d35400 100%)', color: '#fff', transition: 'all 0.2s', '&:hover': { background: 'linear-gradient(90deg, #d35400 60%, #ff9800 100%)', boxShadow: 4 } }}
                    >
                      Download PDF
                    </Button>
                  </Box>
                </Box>

              )}
            </CardContent>
          </Card>
        </Box>
        {/* Update CGPA Card */}
        <Box
          sx={{
            flex: 1,
            minWidth: { xs: '80%', sm: 300, md: 300, lg: 400 },
            maxWidth: '100%',
            width: { xs: '85%', md: '33%', lg: '33%' },
            mx: { xs: 1, lg: 1 },
            mb: { xs: 2, lg: 0 },
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Card
            sx={{
              borderRadius: 6,
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid #ececec',
              p: { xs: 2, md: 3 },
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'stretch',
              transition: 'box-shadow 0.2s, transform 0.2s',
              '&:hover': {
                boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.18)',
                transform: 'translateY(-2px) scale(1.01)',
              },
            }}
          >
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#222', fontFamily: 'Poppins', fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' } }}>
                  Overall CGPA
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ width: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff9800', fontFamily: 'Poppins', fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' }, wordBreak: 'break-word' }}>
                  {overallCgpa !== '' ? `Overall CGPA: ${overallCgpa}` : 'Add semesters to calculate your overall CGPA.'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
      {/* Grading Table section */}
      <Box ref={gradeTableRef} sx={{ minWidth: { xs: '70%', sm: 300, md: 300, lg: 400 }, maxWidth: '100%', width: { xs: '90%', md: '50%', lg: '50rem' }, mx: { xs: 2, lg: 'auto' }, mb: 1 }}>
        <Card sx={{ borderRadius: 5, boxShadow: 4, p: { xs: 0, sm: 0 }, width: '100%' }}>
          <CardContent>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#d35400', mb: 2, fontFamily: 'Poppins', fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
              Grading Table
            </Typography>
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 1, mb: 2, width: '100%' }}>
                <Table sx={{ width: '100%', minWidth: 400 }}>
                  <TableHead>
                    <TableRow sx={{ background: '#f0f0f0' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', sm: '1rem' }, px: { xs: 1, sm: 2 } }}>% Marks</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', sm: '1rem' }, px: { xs: 1, sm: 2 } }}>Grade Point</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', sm: '1rem' }, px: { xs: 1, sm: 2 } }}>Letter Grade</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', sm: '1rem' }, px: { xs: 1, sm: 2 } }}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gradingTable.map((row, idx) => (
                      <TableRow key={idx} sx={{ background: idx % 2 === 0 ? '#f7f7f7' : '#f0f0f0' }}>
                        <TableCell sx={{ fontSize: { xs: '0.85rem', sm: '1rem' }, px: { xs: 1, sm: 2 } }}>{row.min === row.max ? row.min : `${row.min}–${row.max}`}</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.85rem', sm: '1rem' }, px: { xs: 1, sm: 2 } }}>{row.point.toFixed(2)}</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.85rem', sm: '1rem' }, px: { xs: 1, sm: 2 } }}>{row.grade}</TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.85rem', sm: '1rem' }, px: { xs: 1, sm: 2 } }}>{gradeRemarks[row.grade] || ''}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>
      {/* Placeholder for Contact/footer section */}
      <Box ref={contactRef} className="snap-section" sx={{ background: '#f0f0f0', py: 4, mt: 8, width: '100%' }}>
        <Box
          sx={{
            minWidth: { xs: '80%', sm: 300, md: 300, lg: 400 },
            maxWidth: '100%',
            width: { xs: '90%', md: '50%', lg: '50rem' },
            mx: 'auto',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 1.5, md: 2 },
            px: 2,
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#d35400',
              fontFamily: 'Poppins',
              fontWeight: 500,
              mb: { xs: 1, md: 0 },
              width: { xs: '100%', md: 'auto' },
              textAlign: { xs: 'center', md: 'left' },
            }}
          >
            © {new Date().getFullYear()} Mona DevDizyn | All rights reserved.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 3 },
              alignItems: 'center',
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <Button color="inherit" sx={{ fontWeight: 500, fontFamily: 'Poppins', textTransform: 'none', width: { xs: '100%', sm: 'auto' }, fontSize: { xs: '0.95rem', sm: '1rem' } }} onClick={() => handleNavClick(heroRef)}>Home</Button>
            <Button color="inherit" sx={{ fontWeight: 500, fontFamily: 'Poppins', textTransform: 'none', width: { xs: '100%', sm: 'auto' }, fontSize: { xs: '0.95rem', sm: '1rem' } }} onClick={() => handleNavClick(gradeEntryRef)}>GPA Calculator</Button>
            <Button color="inherit" sx={{ fontWeight: 500, fontFamily: 'Poppins', textTransform: 'none', width: { xs: '100%', sm: 'auto' }, fontSize: { xs: '0.95rem', sm: '1rem' } }} onClick={() => handleNavClick(gradeTableRef)}>Grade Table</Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
