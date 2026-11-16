const enquiryService = require('../services/enquiry.service');

const listEnquiries = async (req, res, next) => {
  try {
    const { search, status, temperature, source, followup, special, page, limit } = req.query;
    const result = await enquiryService.listEnquiries({
      search,
      status,
      temperature,
      source,
      followup,
      special,
      page,
      limit,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getEnquiryById = async (req, res, next) => {
  try {
    const enquiry = await enquiryService.getEnquiryById(req.params.id);
    res.status(200).json({ success: true, data: enquiry });
  } catch (error) {
    next(error);
  }
};

const createEnquiry = async (req, res, next) => {
  try {
    const enquiry = await enquiryService.createEnquiry(req.body, req.user?._id);
    res.status(201).json({ success: true, message: 'Enquiry created successfully', data: enquiry });
  } catch (error) {
    next(error);
  }
};

const updateEnquiry = async (req, res, next) => {
  try {
    const enquiry = await enquiryService.updateEnquiry(req.params.id, req.body, req.user?._id);
    res.status(200).json({ success: true, message: 'Enquiry updated successfully', data: enquiry });
  } catch (error) {
    next(error);
  }
};

const addRemark = async (req, res, next) => {
  try {
    const enquiry = await enquiryService.addRemark(req.params.id, req.body.text, req.user?._id);
    res.status(200).json({ success: true, message: 'Remark added', data: enquiry });
  } catch (error) {
    next(error);
  }
};

const qualifyEnquiry = async (req, res, next) => {
  try {
    const enquiry = await enquiryService.qualifyEnquiry(req.params.id, req.body, req.user?._id);
    res.status(200).json({ success: true, message: 'Enquiry qualified successfully', data: enquiry });
  } catch (error) {
    next(error);
  }
};

const rejectEnquiry = async (req, res, next) => {
  try {
    const enquiry = await enquiryService.rejectEnquiry(req.params.id, req.body, req.user?._id);
    res.status(200).json({ success: true, message: 'Enquiry marked as Not Qualified', data: enquiry });
  } catch (error) {
    next(error);
  }
};

const toggleSpecialFollowup = async (req, res, next) => {
  try {
    const enquiry = await enquiryService.toggleSpecialFollowup(req.params.id, req.user?._id);
    res.status(200).json({ success: true, message: 'Special Follow-up updated', data: enquiry });
  } catch (error) {
    next(error);
  }
};

const deleteEnquiry = async (req, res, next) => {
  try {
    const result = await enquiryService.deleteEnquiry(req.params.id, req.user?._id);
    res.status(200).json({ success: true, message: result.message, id: result.id });
  } catch (error) {
    next(error);
  }
};

const checkPhone = async (req, res, next) => {
  try {
    const { phone } = req.query;
    const match = await enquiryService.checkPhoneDuplicate(phone);
    res.status(200).json({ success: true, exists: Boolean(match), data: match });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listEnquiries,
  getEnquiryById,
  createEnquiry,
  updateEnquiry,
  addRemark,
  qualifyEnquiry,
  rejectEnquiry,
  toggleSpecialFollowup,
  deleteEnquiry,
  checkPhone,
};
