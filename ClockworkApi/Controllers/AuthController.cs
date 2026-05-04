using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClockworkApi.Data;
using ClockworkApi.DTOs;
using ClockworkApi.Models;
using ClockworkApi.Services;

namespace ClockworkApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokenService;

    public AuthController(AppDbContext db, TokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    // POST /api/auth/signup
    [HttpPost("signup")]
    public async Task<IActionResult> SignUp([FromBody] SignUpRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { error = "Email and password are required." });

        if (req.Password.Length < 6)
            return BadRequest(new { error = "Password must be at least 6 characters." });

        var exists = await _db.Users.AnyAsync(u => u.Email == req.Email.ToLower());
        if (exists)
            return Conflict(new { error = "An account with this email already exists." });

        var user = new User
        {
            Email = req.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            DefaultRate = req.DefaultRate,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = _tokenService.GenerateToken(user);
        return Ok(new AuthResponse(token, ToDto(user)));
    }

    // POST /api/auth/signin
    [HttpPost("signin")]
    public async Task<IActionResult> SignIn([FromBody] SignInRequest req)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == req.Email.Trim().ToLower());

        if (user is null)
            return Unauthorized(new { error = "No account found with that email." });

        if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { error = "Incorrect password." });

        var token = _tokenService.GenerateToken(user);
        return Ok(new AuthResponse(token, ToDto(user)));
    }

    private static UserDto ToDto(User u) =>
        new(u.Id, u.Email, u.DefaultRate, u.CreatedAt);
}
