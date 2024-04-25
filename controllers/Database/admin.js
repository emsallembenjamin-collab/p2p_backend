const Admin = require("../../models/admin");
const { AccountRole } = require("../constant");
const speakeasy = require("speakeasy");

const findAdminByEmail = async (email) => {
  try {
    let result = await Admin.findOne({ email });
    console.log(result);
    if (result) {
      return result;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
};
const findAdminByUuid = async (adminUuid) => {
  try {
    let result = await Admin.findOne({ adminUuid });

    console.log(result);
    if (result) {
      return result;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
};

const createAdmin = async (data) => {
  const _data = {
    ...data,
    role: AccountRole.ADMIN,
  };
  try {
    let admin = new Admin({ ..._data });
    let result = await admin.save();
    return result;
  } catch (e) {
    console.log("Create Admin", e);
    return false;
  }
};

const updateAdminInfo = async (email, data) => {
  try {
    let result = await Admin.findOneAndUpdate(
      { email },
      { ...data },
      { new: true }
    );
    return result;
  } catch (e) {
    console.log("updateSuperAccount:", e);
    return false;
  }
};

const getAdmins = async () => {
  try {
    let result = await Admin.aggregate([
      {
        $lookup: {
          from: "roles",
          foreignField: "roleUuid",
          localField: "subRole",
          as: "adminRole",
        },
      },
      {
        $unwind: {
          path: "$adminRole",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
            "hidden":{
                $ne: "hidden"
            } 
        }
      },
      {
        $project: {
          adminUuid: 1,
          email: 1,
          name: 1,
          enable2FA: 1,
          secret: 1,
          adminRole: "$adminRole.name",
          subRole: 1,
          createdAt: 1,
          role: 1
        },
      },
    ]);
    return result;
  } catch (e) {
    console.log("Get Admins:", e);
    return false;
  }
};

const generateSecret = (email) => {
  let secret = speakeasy.generateSecret({ length: 16, symbols: true });
  updateAdminInfo(email, { secret: secret.base32 });
  return secret.base32;
};

const AdminService = {
  findAdminByEmail,
  createAdmin,
  updateAdminInfo,
  getAdmins,
  findAdminByUuid,
  generateSecret,
};
module.exports = AdminService;
