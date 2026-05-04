using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ClockworkApi.Data;
using ClockworkApi.DTOs;
using ClockworkApi.Models;

namespace ClockworkApi.Controllers;

[ApiController]
[Route("api/consultations")]
[Authorize]
public class ConsultationsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ConsultationsController(AppDbContext db)
    {
        _db = db;
    }

    private int UserId => int.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET /api/consultations?clientId=1&date=2025-04
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? clientId,
        [FromQuery] string? date)
    {
        var query = _db.Consultations
            .Where(c => c.UserId == UserId);

        if (clientId.HasValue)
            query = query.Where(c => c.ClientId == clientId.Value);

        if (!string.IsNullOrWhiteSpace(date))
        {
            // Support filtering by "YYYY-MM" or "YYYY-MM-DD"
            query = query.Where(c =>
                c.StartDatetime.ToString().StartsWith(date));
        }

        var results = await query
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => ToDto(c))
            .ToListAsync();

        return Ok(results);
    }

    // GET /api/consultations/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetOne(int id)
    {
        var consultation = await _db.Consultations
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);

        if (consultation is null) return NotFound();
        return Ok(ToDto(consultation));
    }

    // POST /api/consultations
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateConsultationRequest req)
    {
        // Verify client belongs to this user
        var client = await _db.Clients
            .FirstOrDefaultAsync(c => c.Id == req.ClientId && c.UserId == UserId);

        if (client is null)
            return BadRequest(new { error = "Client not found." });

        var consultation = new Consultation
        {
            UserId = UserId,
            ClientId = req.ClientId,
            ClientName = req.ClientName,
            StartDatetime = req.StartDatetime,
            EndDatetime = req.EndDatetime,
            DurationMinutes = req.DurationMinutes,
            TotalCharge = req.TotalCharge,
            Notes = req.Notes,
        };

        _db.Consultations.Add(consultation);

        // Update client total owed
        client.TotalOwed += req.TotalCharge;

        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetOne), new { id = consultation.Id }, ToDto(consultation));
    }

    // PUT /api/consultations/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateConsultationRequest req)
    {
        var consultation = await _db.Consultations
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);

        if (consultation is null) return NotFound();

        // If charge is being changed, adjust client totalOwed
        if (req.TotalCharge.HasValue && req.TotalCharge.Value != consultation.TotalCharge)
        {
            var client = await _db.Clients.FindAsync(consultation.ClientId);
            if (client is not null)
            {
                client.TotalOwed = Math.Max(0,
                    client.TotalOwed - consultation.TotalCharge + req.TotalCharge.Value);
            }
            consultation.TotalCharge = req.TotalCharge.Value;
        }

        if (req.Notes is not null) consultation.Notes = req.Notes;

        await _db.SaveChangesAsync();
        return Ok(ToDto(consultation));
    }

    // DELETE /api/consultations/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var consultation = await _db.Consultations
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);

        if (consultation is null) return NotFound();

        // Reduce client totalOwed
        var client = await _db.Clients.FindAsync(consultation.ClientId);
        if (client is not null)
        {
            client.TotalOwed = Math.Max(0, client.TotalOwed - consultation.TotalCharge);
        }

        _db.Consultations.Remove(consultation);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static ConsultationDto ToDto(Consultation c) =>
        new(c.Id, c.UserId, c.ClientId, c.ClientName,
            c.StartDatetime, c.EndDatetime, c.DurationMinutes,
            c.TotalCharge, c.Notes, c.CreatedAt);
}
