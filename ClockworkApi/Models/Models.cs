namespace ClockworkApi.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public decimal DefaultRate { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Client> Clients { get; set; } = new List<Client>();
    public ICollection<Consultation> Consultations { get; set; } = new List<Consultation>();
}

public class Client
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public decimal HourlyRate { get; set; }
    public string Notes { get; set; } = string.Empty;
    public decimal TotalOwed { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public ICollection<Consultation> Consultations { get; set; } = new List<Consultation>();
}

public class Consultation
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public DateTime StartDatetime { get; set; }
    public DateTime EndDatetime { get; set; }
    public int DurationMinutes { get; set; }
    public decimal TotalCharge { get; set; }
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public Client Client { get; set; } = null!;
}
