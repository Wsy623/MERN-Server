const router = require("express").Router();
const Course = require("../models").course;
const courseValidation = require("../valiadation").courseValidation;

router.use((req, res, next) => {
  console.log("Course route is receiving request");
  next();
});

router.post("/enroll/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let course = await Course.findOne({ _id }).exec();
    course.students.push(req.user._id);
    await course.save();
    return res.send("Registration Complete");
  } catch (e) {
    return res.send(e);
  }
});

router.post("/", async (req, res) => {
  let { error } = courseValidation(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  if (req.user.isStudent()) {
    return res
      .status(400)
      .send(
        "Only instructors can publish new courses. If you are already an instructor, please log in with your instructor account."
      );
  }

  let { title, description, price } = req.body;
  try {
    let newCourse = new Course({
      title,
      description,
      price,
      instructor: req.user._id,
    });
    let savedCourse = await newCourse.save();
    return res.send({ msg: "New course is saved", savedCourse });
  } catch (e) {
    return res.status(500).send("Unable to create a course");
  }
});

router.get("/findByName/:name", async (req, res) => {
  let { name } = req.params;
  try {
    let courseFound = await Course.find({ title: name })
      .populate("instructor", ["email", "username"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

router.get("/", async (req, res) => {
  try {
    let courseFound = await Course.find({})
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

router.get("/instructor/:_instructor_id", async (req, res) => {
  let { _instructor_id } = req.params;
  let coursesFound = await Course.find({ instructor: _instructor_id })
    .populate("instructor", ["username", "email"])
    .exec();

  return res.send(coursesFound);
});

router.get("/student/:_student_id", async (req, res) => {
  let { _student_id } = req.params;
  let coursesFound = await Course.find({ students: _student_id })
    .populate("instructor", ["username", "email"])
    .exec();
  return res.send(coursesFound);
});

router.get("/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let courseFound = await Course.findOne({ _id })
      .populate("instructor", ["email"])
      .exec();
  } catch (e) {
    return res.status(500).send(e);
  }
});

router.patch("/:_id", async (req, res) => {
  let { error } = courseValidation(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  let { _id } = req.params;
  try {
    let courseFound = await Course.findOne({ _id });
    if (!courseFound) {
      return res.status(400).send("Unable to find the course");
    }
    if (courseFound.instructor.equals(req.user._id)) {
      let updatedCourse = await Course.findOneAndUpdate({ _id }, req.body, {
        new: true,
        runValidators: true,
      });
      return res.send({
        msg: "The course has been successfully updated.",
        updatedCourse,
      });
    } else {
      return res
        .status(400)
        .send("Only the instructor of the course can edit the course.");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

router.delete("/:_id", async (req, res) => {
  let { _id } = req.params;
  let courseFound = await Course.findOne({ _id });
  if (!courseFound) {
    return res.status(400).send("Course not found, unable to delete.");
  }

  if (courseFound.instructor.equals(req.user._id)) {
    Course.deleteOne({ _id }).exec();
    return res.send("The course has been deleted.");
  }
  return res
    .status(403)
    .send("Only the instructor of this course can delete it.");
});
module.exports = router;
