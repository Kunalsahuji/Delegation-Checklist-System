const Project = require('../../master/models/project.model');

class ProjectService {
  /**
   * List all active projects with unit statistics
   */
  async listProjects({ search = '', status = '', propertyType = '', page = 1, limit = 50 } = {}) {
    const filter = {
      deletedAt: null,
    };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (propertyType && propertyType !== 'all') {
      filter.propertyType = propertyType;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { code: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [rawProjects, totalCount, allActive] = await Promise.all([
      Project.find(filter)
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      Project.countDocuments(filter),
      Project.find({ deletedAt: null }).select('status units').lean(),
    ]);

    // Calculate per-project unit statistics
    const projects = rawProjects.map((p) => {
      const units = p.units || [];
      const totalUnits = units.length;
      const availableUnits = units.filter((u) => u.status === 'available').length;
      const bookedUnits = units.filter((u) => u.status === 'booked').length;
      const reservedUnits = units.filter((u) => u.status === 'reserved').length;
      const heldUnits = units.filter((u) => u.status === 'held').length;

      return {
        ...p,
        stats: {
          totalUnits,
          availableUnits,
          bookedUnits,
          reservedUnits,
          heldUnits,
        },
      };
    });

    // Calculate global summary KPIs
    let globalTotalUnits = 0;
    let globalAvailableUnits = 0;
    let globalBookedUnits = 0;
    let globalOpenProjects = 0;

    for (const item of allActive) {
      if (item.status === 'open') globalOpenProjects++;
      const uList = item.units || [];
      globalTotalUnits += uList.length;
      for (const u of uList) {
        if (u.status === 'available') globalAvailableUnits++;
        if (u.status === 'booked') globalBookedUnits++;
      }
    }

    return {
      projects,
      totalCount,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalCount / take) || 1,
      kpis: {
        totalProjects: allActive.length,
        openProjects: globalOpenProjects,
        totalUnits: globalTotalUnits,
        availableUnits: globalAvailableUnits,
        bookedUnits: globalBookedUnits,
      },
    };
  }

  /**
   * Get single project details by ID with populated units
   */
  async getProjectById(id) {
    const project = await Project.findOne({ _id: id, deletedAt: null })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!project) {
      const err = new Error('Project not found');
      err.status = 404;
      throw err;
    }

    const pObj = project.toObject();
    const units = pObj.units || [];
    const stats = {
      totalUnits: units.length,
      availableUnits: units.filter((u) => u.status === 'available').length,
      bookedUnits: units.filter((u) => u.status === 'booked').length,
      reservedUnits: units.filter((u) => u.status === 'reserved').length,
      heldUnits: units.filter((u) => u.status === 'held').length,
    };

    return { ...pObj, stats };
  }

  /**
   * Create new project
   */
  async createProject(data, actorId) {
    const { name, code, location, propertyType, status, description, latitude, longitude, geoFenceRadius, googleMapLink, sitePlanUrl } = data;

    if (!name || !name.trim()) {
      const err = new Error('Project name is required');
      err.status = 400;
      throw err;
    }

    // Check unique name among active projects
    const existing = await Project.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
      deletedAt: null,
    });
    if (existing) {
      const err = new Error(`A project named "${name.trim()}" already exists`);
      err.status = 409;
      throw err;
    }

    const project = await Project.create({
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : undefined,
      location: location ? location.trim() : '',
      propertyType: propertyType || 'Residential',
      status: status || 'open',
      description: description ? description.trim() : '',
      latitude: latitude !== undefined && latitude !== '' ? Number(latitude) : null,
      longitude: longitude !== undefined && longitude !== '' ? Number(longitude) : null,
      geoFenceRadius: geoFenceRadius ? Number(geoFenceRadius) : 500,
      googleMapLink: googleMapLink ? googleMapLink.trim() : '',
      sitePlanUrl: sitePlanUrl ? sitePlanUrl.trim() : '',
      createdBy: actorId || null,
      updatedBy: actorId || null,
      active: true,
    });

    return project;
  }

  /**
   * Update existing project
   */
  async updateProject(id, data, actorId) {
    const project = await Project.findOne({ _id: id, deletedAt: null });
    if (!project) {
      const err = new Error('Project not found');
      err.status = 404;
      throw err;
    }

    const { name, code, location, propertyType, status, description, latitude, longitude, geoFenceRadius, googleMapLink, sitePlanUrl } = data;

    if (name && name.trim()) {
      const duplicate = await Project.findOne({
        _id: { $ne: id },
        name: { $regex: `^${name.trim()}$`, $options: 'i' },
        deletedAt: null,
      });
      if (duplicate) {
        const err = new Error(`A project named "${name.trim()}" already exists`);
        err.status = 409;
        throw err;
      }
      project.name = name.trim();
    }

    if (code !== undefined) project.code = code ? code.trim().toUpperCase() : undefined;
    if (location !== undefined) project.location = location ? location.trim() : '';
    if (propertyType !== undefined) project.propertyType = propertyType;
    if (status !== undefined) project.status = status;
    if (description !== undefined) project.description = description ? description.trim() : '';
    if (latitude !== undefined) project.latitude = latitude !== '' && latitude !== null ? Number(latitude) : null;
    if (longitude !== undefined) project.longitude = longitude !== '' && longitude !== null ? Number(longitude) : null;
    if (geoFenceRadius !== undefined) project.geoFenceRadius = Number(geoFenceRadius) || 500;
    if (googleMapLink !== undefined) project.googleMapLink = googleMapLink ? googleMapLink.trim() : '';
    if (sitePlanUrl !== undefined) project.sitePlanUrl = sitePlanUrl ? sitePlanUrl.trim() : '';

    project.updatedBy = actorId || null;
    await project.save();

    return project;
  }

  /**
   * Soft delete project
   */
  async deleteProject(id, actorId) {
    const project = await Project.findOne({ _id: id, deletedAt: null });
    if (!project) {
      const err = new Error('Project not found');
      err.status = 404;
      throw err;
    }

    project.deletedAt = new Date();
    project.deletedBy = actorId || null;
    project.active = false;
    await project.save();

    return { message: 'Project deleted successfully', id };
  }

  /**
   * Add a unit to a project
   */
  async addUnit(projectId, unitData) {
    const project = await Project.findOne({ _id: projectId, deletedAt: null });
    if (!project) {
      const err = new Error('Project not found');
      err.status = 404;
      throw err;
    }

    const { unitNumber, unitType, area, facing, price, status, notes } = unitData;

    if (!unitNumber || !unitNumber.trim()) {
      const err = new Error('Unit number is required');
      err.status = 400;
      throw err;
    }

    const cleanNumber = unitNumber.trim();
    const exists = project.units.some(
      (u) => u.unitNumber.toLowerCase() === cleanNumber.toLowerCase()
    );
    if (exists) {
      const err = new Error(`Unit "${cleanNumber}" already exists in this project`);
      err.status = 409;
      throw err;
    }

    const newUnit = {
      unitNumber: cleanNumber,
      unitType: unitType || 'Villa',
      area: area ? area.trim() : '',
      facing: facing ? facing.trim() : '',
      price: Number(price) || 0,
      status: status || 'available',
      notes: notes ? notes.trim() : '',
    };

    project.units.push(newUnit);
    await project.save();

    return project.units[project.units.length - 1];
  }

  /**
   * Update a unit in a project
   */
  async updateUnit(projectId, unitId, unitData) {
    const project = await Project.findOne({ _id: projectId, deletedAt: null });
    if (!project) {
      const err = new Error('Project not found');
      err.status = 404;
      throw err;
    }

    const unit = project.units.id(unitId);
    if (!unit) {
      const err = new Error('Unit not found');
      err.status = 404;
      throw err;
    }

    const { unitNumber, unitType, area, facing, price, status, notes, buyerName, buyerPhone } = unitData;

    if (unitNumber && unitNumber.trim()) {
      const cleanNumber = unitNumber.trim();
      const duplicate = project.units.some(
        (u) => u._id.toString() !== unitId && u.unitNumber.toLowerCase() === cleanNumber.toLowerCase()
      );
      if (duplicate) {
        const err = new Error(`Unit "${cleanNumber}" already exists in this project`);
        err.status = 409;
        throw err;
      }
      unit.unitNumber = cleanNumber;
    }

    if (unitType !== undefined) unit.unitType = unitType;
    if (area !== undefined) unit.area = area ? area.trim() : '';
    if (facing !== undefined) unit.facing = facing ? facing.trim() : '';
    if (price !== undefined) unit.price = Number(price) || 0;
    if (notes !== undefined) unit.notes = notes ? notes.trim() : '';
    if (buyerName !== undefined) unit.buyerName = buyerName ? buyerName.trim() : '';
    if (buyerPhone !== undefined) unit.buyerPhone = buyerPhone ? buyerPhone.trim() : '';

    if (status !== undefined) {
      unit.status = status;
      if (status === 'booked' && !unit.bookedAt) {
        unit.bookedAt = new Date();
      } else if (status === 'available') {
        unit.bookedAt = null;
        unit.buyerName = '';
        unit.buyerPhone = '';
      }
    }

    await project.save();
    return unit;
  }

  /**
   * Delete a unit from a project
   */
  async deleteUnit(projectId, unitId) {
    const project = await Project.findOne({ _id: projectId, deletedAt: null });
    if (!project) {
      const err = new Error('Project not found');
      err.status = 404;
      throw err;
    }

    const unit = project.units.id(unitId);
    if (!unit) {
      const err = new Error('Unit not found');
      err.status = 404;
      throw err;
    }

    project.units.pull(unitId);
    await project.save();

    return { message: 'Unit removed successfully', unitId };
  }
}

module.exports = new ProjectService();
