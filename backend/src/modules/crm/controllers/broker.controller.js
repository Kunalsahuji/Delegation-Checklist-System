const brokerService = require('../services/broker.service');

const getKPIs = async (req, res, next) => {
  try {
    const kpis = await brokerService.getKPIs();
    return res.status(200).json({ success: true, data: kpis });
  } catch (error) {
    next(error);
  }
};

const listBrokers = async (req, res, next) => {
  try {
    const result = await brokerService.listBrokers(req.query);
    return res.status(200).json({
      success: true,
      data: result.brokers,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getBrokerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await brokerService.getBrokerById(id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const createBroker = async (req, res, next) => {
  try {
    const actor = req.user || null;
    const broker = await brokerService.createBroker(req.body, actor);
    return res.status(201).json({
      success: true,
      message: 'Channel partner registered successfully',
      data: broker,
    });
  } catch (error) {
    next(error);
  }
};

const updateBroker = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actor = req.user || null;
    const updated = await brokerService.updateBroker(id, req.body, actor);
    return res.status(200).json({
      success: true,
      message: 'Partner details updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const deleteBroker = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actor = req.user || null;
    const result = await brokerService.deleteBroker(id, actor);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

const getNetwork = async (req, res, next) => {
  try {
    const hierarchy = await brokerService.getNetworkHierarchy();
    return res.status(200).json({ success: true, data: hierarchy });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKPIs,
  listBrokers,
  getBrokerById,
  createBroker,
  updateBroker,
  deleteBroker,
  getNetwork,
};
