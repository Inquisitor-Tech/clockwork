using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ClockworkApi.Data;
using ClockworkApi.DTOs;
using ClockworkApi.Models;

namespace ClockworkApi.Controllers;

[ApiController]
[Route("api/clients")]
[Authorize]
public class ClientsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ClientsController(AppDbContext db)
    {
        _db = db;
    }

    private int UserId => int.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET /api/clients
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var clients = await _db.Clients
            .Where(c => c.UserId == UserId)
            .OrderBy(c => c.FullName)
            .Select(c => ToDto(c))
            .ToListAsync();

        return Ok(clients);
    }

    // GET /api/clients/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetOne(int id)
    {
        var client = await _db.Clients
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);

        if (client is null) return NotFound();
        return Ok(ToDto(client));
    }

    // POST /api/clients
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateClientRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.FullName))
            return BadRequest(new { error = "Client name is required." });

        var client = new Client
        {
            UserId = UserId,
            FullName = req.FullName.Trim(),
            Email = req.Email.Trim(),
            Phone = req.Phone.Trim(),
            HourlyRate = req.HourlyRate,
            Notes = req.Notes.Trim(),
        };

        _db.Clients.Add(client);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetOne), new { id = client.Id }, ToDto(client));
    }

    // PUT /api/clients/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateClientRequest req)
    {
        var client = await _db.Clients
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);

        if (client is null) return NotFound();

        if (req.FullName is not null) client.FullName = req.FullName.Trim();
        if (req.Email is not null) client.Email = req.Email.Trim();
        if (req.Phone is not null) client.Phone = req.Phone.Trim();
        if (req.HourlyRate is not null) client.HourlyRate = req.HourlyRate.Value;
        if (req.Notes is not null) client.Notes = req.Notes.Trim();

        await _db.SaveChangesAsync();
        return Ok(ToDto(client));
    }

    // DELETE /api/clients/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var client = await _db.Clients
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);

        if (client is null) return NotFound();

        _db.Clients.Remove(client);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static ClientDto ToDto(Client c) =>
        new(c.Id, c.UserId, c.FullName, c.Email, c.Phone,
            c.HourlyRate, c.TotalOwed, c.Notes, c.CreatedAt);
}
