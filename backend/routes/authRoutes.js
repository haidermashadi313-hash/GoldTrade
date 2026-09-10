// =========================================
// SIGNUP (FINAL PRODUCTION FIX)
// POST /api/auth/signup
// =========================================
router.post("/signup", async (req, res) => {
  try {
    let { username, email, password } = req.body;

    username = username?.trim();
    email = email?.trim().toLowerCase();
    password = password?.trim();

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    // Duplicate username
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: "Username already exists.",
      });
    }

    // Duplicate email
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Email already registered.",
      });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: email === "admin@goldtrade.com" ? "admin" : "user",
      status: "Active",
      walletBalance: 0,
      usdtBalance: 0,
      goldBalance: 0,
      goldAveragePrice: 0,
      goldProfitLoss: 0,
      totalDeposit: 0,
      totalWithdraw: 0,
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("❌ SIGNUP ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Signup failed.",
    });
  }
});